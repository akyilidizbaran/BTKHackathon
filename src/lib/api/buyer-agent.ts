import {
  buyerSmartCartExamples,
  getBuyerSmartCartApiData,
  validateBuyerSmartCartRequest,
  type BuyerSmartCartApiData,
  type BuyerSmartCartApiRequest,
  type BuyerSmartCartValidationResult,
} from "@/lib/api/buyer";
import {
  generateLlmJson,
  getConfiguredLlmModel,
  normalizeLlmString,
  normalizeLlmStringArray,
} from "@/lib/llm";
import type { LlmJsonValidationResult, LlmTextGenerationResult } from "@/lib/llm";
import {
  getBuyerCatalogApiData,
  type BuyerCatalogProductCard,
} from "@/lib/api/buyer-catalog";
import {
  createAgentExecutionTrace,
  createAgentRuntimeSnapshot,
  type AgentExecutionTrace,
  type AgentRuntimeSnapshot,
} from "@/lib/agents/runtime";
import {
  analyzeBuyerCatalogPrompt,
  hasUnsupportedBuyerCatalogTerm,
} from "@/lib/agents/buyer-catalog-guardrails";
import {
  buyerAgentApplyEndpoint,
  createBuyerAgentApplyPreview,
  getBuyerAgentApplyApiData,
  validateBuyerAgentApplyRequest,
  type BuyerAgentApplyApiData,
  type BuyerAgentApplyPreview,
  type BuyerAgentApplyRequest,
  type BuyerAgentApplyRequestItem,
  type BuyerAgentApplyStrategy,
  type BuyerAgentApplyValidationError,
  type BuyerAgentApplyValidationResult,
  type BuyerAgentApplyValidationSuccess,
} from "@/lib/agents/buyer-cart-apply";
import type {
  BuyerCartWarning,
  BuyerProductSuggestion,
  BuyerSmartCartItem,
} from "@/lib/workflows";

export const buyerAgentEndpoint = "/api/buyer/agent";
export { buyerAgentApplyEndpoint, getBuyerAgentApplyApiData, validateBuyerAgentApplyRequest };
export type {
  BuyerAgentApplyApiData,
  BuyerAgentApplyPreview,
  BuyerAgentApplyRequest,
  BuyerAgentApplyRequestItem,
  BuyerAgentApplyStrategy,
  BuyerAgentApplyValidationError,
  BuyerAgentApplyValidationResult,
  BuyerAgentApplyValidationSuccess,
};

export interface BuyerAgentApiContractMeta {
  envelope: "success/data/error";
  source: "buyer-agent-smart-cart";
  generatedAt: string;
  endpoint: typeof buyerAgentEndpoint;
  method: "POST";
}

export interface BuyerAgentApiData {
  contract: BuyerAgentApiContractMeta;
  request: BuyerSmartCartApiRequest;
  message: {
    role: "assistant";
    content: string;
    confirmationQuestion: string;
  };
  summary: {
    itemCount: number;
    totalPrice: number;
    confidenceScore: number;
    warningCount: number;
    intentLabel: string;
    budgetStatusLabel: string;
  };
  recommendations: BuyerAgentRecommendation[];
  warnings: BuyerCartWarning[];
  alternatives: BuyerAgentSuggestion[];
  complementarySuggestions: BuyerAgentSuggestion[];
  sourceSmartCart: BuyerSmartCartApiData;
  runtime: AgentRuntimeSnapshot;
  applyPreview: BuyerAgentApplyPreview;
  orchestration: BuyerAgentLlmOrchestration;
  agentTrace: AgentExecutionTrace;
}

export interface BuyerAgentRecommendation {
  item: BuyerSmartCartItem;
  product: BuyerCatalogProductCard;
  primaryReason: string;
  warningTitles: string[];
}

export interface BuyerAgentSuggestion {
  suggestion: BuyerProductSuggestion;
  product?: BuyerCatalogProductCard;
}

export interface BuyerAgentLlmOrchestration {
  status: LlmTextGenerationResult["status"];
  provider: LlmTextGenerationResult["provider"];
  model: string;
  generatedAt: string;
  rankedProductIds: string[];
  recommendationReasons: Record<string, string>;
  riskNotes: string[];
  cartStrategySuggestion: BuyerAgentApplyStrategy;
  fallbackReason?: string;
}

export interface BuyerAgentApiOptions {
  forceFallback?: boolean;
  modelTextOverride?: string;
}

interface BuyerAgentModelBody {
  messageContent: string;
  confirmationQuestion: string;
  rankedProductIds: string[];
  recommendationReasons: Record<string, string>;
  riskNotes: string[];
  cartStrategySuggestion: BuyerAgentApplyStrategy;
}

interface BuyerAgentBuildContext {
  applyPreview: BuyerAgentApplyPreview;
  deterministicRecommendations: BuyerAgentRecommendation[];
  fallbackBody: BuyerAgentModelBody;
  productById: Map<string, BuyerCatalogProductCard>;
  runtime: AgentRuntimeSnapshot;
  sourceSmartCart: BuyerSmartCartApiData;
}

export function getDefaultBuyerAgentApiData(): BuyerAgentApiData {
  const defaultExample = buyerSmartCartExamples[0];

  return getDeterministicBuyerAgentApiData({
    buyerId: defaultExample.buyerId,
    prompt: defaultExample.prompt,
  });
}

export function validateBuyerAgentRequest(rawInput: unknown): BuyerSmartCartValidationResult {
  const validation = validateBuyerSmartCartRequest(rawInput);

  if (!validation.ok) {
    return validation;
  }

  const catalogGuard = analyzeBuyerCatalogPrompt(validation.value.prompt);

  if (!catalogGuard.ok) {
    return {
      code: "BUYER_CATALOG_UNSUPPORTED_PROMPT",
      message: catalogGuard.message ?? "Bu ürün tipi şu an CommercePilot kataloğunda yok.",
      ok: false,
      status: 422,
    };
  }

  return validation;
}

export async function getBuyerAgentApiData(
  request: BuyerSmartCartApiRequest,
  options: BuyerAgentApiOptions = {},
): Promise<BuyerAgentApiData> {
  const context = createBuyerAgentBuildContext(request);
  const llmResult = await generateLlmJson({
    fallbackValue: context.fallbackBody,
    forceFallback: options.forceFallback,
    input: createBuyerAgentModelInput(context),
    instructions: createBuyerAgentModelInstructions(),
    maxOutputTokens: 650,
    metadata: {
      buyer_id: context.sourceSmartCart.request.buyerId ?? "buyer-aylin",
      intent_type: context.sourceSmartCart.summary.intentType,
      task: "buyer_agent_orchestration",
    },
    modelTextOverride: options.modelTextOverride,
    validate: (value, fallbackValue) => validateBuyerAgentModelBody(value, fallbackValue, context),
  });

  return composeBuyerAgentApiData(context, llmResult.value, {
    fallbackReason: llmResult.fallbackReason,
    generatedAt: llmResult.generatedAt,
    model: llmResult.model,
    provider: llmResult.provider,
    status: llmResult.status,
  });
}

function getDeterministicBuyerAgentApiData(request: BuyerSmartCartApiRequest): BuyerAgentApiData {
  const context = createBuyerAgentBuildContext(request);

  return composeBuyerAgentApiData(context, context.fallbackBody, {
    fallbackReason: "STATIC_BUYER_AGENT_PREVIEW: İlk render canlı LLM çağrısı yapmadan deterministik contract kullanır.",
    generatedAt: context.sourceSmartCart.contract.generatedAt,
    model: getConfiguredLlmModel(),
    provider: "deterministic",
    status: "fallback",
  });
}

function createBuyerAgentBuildContext(request: BuyerSmartCartApiRequest): BuyerAgentBuildContext {
  const sourceSmartCart = getBuyerSmartCartApiData(request);
  const catalogProducts = getBuyerCatalogApiData().products;
  const productById = new Map(catalogProducts.map((product) => [product.id, product]));
  const deterministicRecommendations = sourceSmartCart.result.selectedItems
    .map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        return undefined;
      }

      return {
        item,
        product,
        primaryReason: createRecommendationReason(item, product),
        warningTitles: item.warnings.map((warning) => warning.title),
      };
    })
    .filter((item): item is BuyerAgentRecommendation => Boolean(item));
  const runtime = createAgentRuntimeSnapshot({
    actorId: sourceSmartCart.request.buyerId ?? "buyer-aylin",
    prompt: sourceSmartCart.request.prompt,
    role: "buyer",
    routeContext: "/buyer/agent",
    surface: "route",
  });
  const applyPreview = createBuyerAgentApplyPreview({
    items: deterministicRecommendations.map((recommendation) => ({
      productId: recommendation.product.id,
      quantity: recommendation.item.quantity,
    })),
  });

  return {
    applyPreview,
    deterministicRecommendations,
    fallbackBody: createFallbackBuyerAgentModelBody(sourceSmartCart, deterministicRecommendations),
    productById,
    runtime,
    sourceSmartCart,
  };
}

function composeBuyerAgentApiData(
  context: BuyerAgentBuildContext,
  modelBody: BuyerAgentModelBody,
  modelMeta: Pick<BuyerAgentLlmOrchestration, "fallbackReason" | "generatedAt" | "model" | "provider" | "status">,
): BuyerAgentApiData {
  const recommendations = rankRecommendations(context.deterministicRecommendations, modelBody)
    .map((recommendation) => ({
      ...recommendation,
      primaryReason: modelBody.recommendationReasons[recommendation.product.id] ?? recommendation.primaryReason,
    }));
  const applyPreview = createBuyerAgentApplyPreview({
    items: recommendations.map((recommendation) => ({
      productId: recommendation.product.id,
      quantity: recommendation.item.quantity,
    })),
  });

  return {
    agentTrace: createBuyerAgentTrace(context, recommendations, applyPreview, modelMeta),
    contract: {
      envelope: "success/data/error",
      source: "buyer-agent-smart-cart",
      generatedAt: modelMeta.generatedAt,
      endpoint: buyerAgentEndpoint,
      method: "POST",
    },
    request: context.sourceSmartCart.request,
    message: {
      role: "assistant",
      content: modelBody.messageContent,
      confirmationQuestion: modelBody.confirmationQuestion,
    },
    summary: {
      budgetStatusLabel: context.sourceSmartCart.summary.budgetStatusLabel,
      confidenceScore: context.sourceSmartCart.summary.confidenceScore,
      intentLabel: context.sourceSmartCart.summary.intentLabel,
      itemCount: recommendations.length,
      totalPrice: context.sourceSmartCart.summary.totalPrice,
      warningCount: context.sourceSmartCart.summary.warningCount,
    },
    recommendations,
    warnings: context.sourceSmartCart.result.warnings,
    alternatives: mapSuggestions(context.sourceSmartCart.result.alternatives, context.productById),
    applyPreview,
    complementarySuggestions: mapSuggestions(context.sourceSmartCart.result.complementarySuggestions, context.productById),
    sourceSmartCart: context.sourceSmartCart,
    runtime: context.runtime,
    orchestration: {
      cartStrategySuggestion: modelBody.cartStrategySuggestion,
      fallbackReason: modelMeta.fallbackReason,
      generatedAt: modelMeta.generatedAt,
      model: modelMeta.model,
      provider: modelMeta.provider,
      rankedProductIds: modelBody.rankedProductIds,
      recommendationReasons: modelBody.recommendationReasons,
      riskNotes: modelBody.riskNotes,
      status: modelMeta.status,
    },
  };
}

function createBuyerAgentTrace(
  context: BuyerAgentBuildContext,
  recommendations: BuyerAgentRecommendation[],
  applyPreview: BuyerAgentApplyPreview,
  modelMeta: Pick<BuyerAgentLlmOrchestration, "fallbackReason" | "generatedAt" | "model" | "provider" | "status">,
): AgentExecutionTrace {
  const buyerId = context.sourceSmartCart.request.buyerId ?? "buyer-aylin";
  const llmStatus = modelMeta.status === "generated" ? "completed" : "guarded";

  return createAgentExecutionTrace({
    generatedAt: modelMeta.generatedAt,
    runtime: context.runtime,
    summary: "Buyer Agent katalog, profil ve smart-cart context'ini LLM sıralaması, guardrail ve onaylı cart apply tool'una bağlar.",
    items: [
      {
        detail: `${buyerId} için prompt, profil sinyalleri, bütçe ve mevcut smart-cart context'i okundu.`,
        endpoint: context.sourceSmartCart.contract.endpoint,
        id: "buyer-context-read",
        label: "Buyer context okundu",
        layer: "context",
        status: "completed",
      },
      {
        detail: `${context.deterministicRecommendations.length} deterministik aday smart-cart workflow ile çıkarıldı.`,
        endpoint: context.sourceSmartCart.contract.endpoint,
        id: "buyer-smart-cart-workflow",
        label: "Smart-cart workflow çalıştı",
        layer: "workflow",
        status: "completed",
      },
      {
        detail: `${modelMeta.provider}/${modelMeta.model} ${modelMeta.status === "generated" ? "ürün sıralaması ve gerekçe üretti" : "fallback contract ile devam etti"}.`,
        id: "buyer-llm-rank",
        label: "LLM ürün sıralaması",
        layer: "llm",
        status: llmStatus,
      },
      {
        detail: `Katalog dışı productId engellendi; ${recommendations.length} öneri apply payload'una taşındı.`,
        id: "buyer-catalog-guardrail",
        label: "Katalog guardrail doğrulandı",
        layer: "guardrail",
        status: "guarded",
      },
      {
        detail: "Sepete yazma işlemi kullanıcı append/replace onayı bekler.",
        endpoint: applyPreview.endpoint,
        id: "buyer-approval-boundary",
        label: "Sepet onayı bekleniyor",
        layer: "approval",
        requiresApproval: true,
        status: "pending",
        toolId: applyPreview.toolId,
      },
      {
        detail: `${applyPreview.toolId} route ve floating yüzeylerinde aynı client helper ile çalışmaya hazır.`,
        endpoint: applyPreview.endpoint,
        id: "buyer-cart-apply-tool-ready",
        label: "Cart apply tool hazır",
        layer: "tool",
        requiresApproval: true,
        status: "ready",
        toolId: applyPreview.toolId,
      },
    ],
  });
}

function createBuyerAgentModelInstructions(): string {
  return [
    "CommercePilot buyer Agent orchestration katmanısın.",
    "Sadece verilen candidateProducts içindeki productId değerlerini kullan; katalog dışı ürün uydurma.",
    "Deterministic smart-cart adaylarını yeniden sırala, kısa gerekçe yaz ve sepete uygulama için kullanıcıdan açık onay iste.",
    "Mutation uygulama; yalnızca mesaj, sıralama, gerekçe, risk notu ve append/replace strateji önerisi üret.",
    "budget.hasRequestedBudget false ise bütçe limiti, bütçeniz X TL veya bütçe içinde/altında iddiası yazma; sadece budgetStatusLabel değerini kullan.",
    "Kesinlikle geçerli JSON dön. Markdown, açıklama veya code fence kullanma.",
    'JSON shape: {"messageContent":"...","confirmationQuestion":"...","rankedProductIds":["..."],"recommendationReasons":{"productId":"..."},"riskNotes":["..."],"cartStrategySuggestion":"append|replace"}',
  ].join("\n");
}

function createBuyerAgentModelInput(context: BuyerAgentBuildContext): string {
  const smartCart = context.sourceSmartCart;

  return JSON.stringify(
    {
      budget: {
        budgetStatusLabel: smartCart.summary.budgetStatusLabel,
        hasRequestedBudget: Boolean(smartCart.result.budget),
        requestedBudget: smartCart.result.budget ?? null,
        softBudgetLimit: smartCart.result.softBudgetLimit ?? null,
        totalPrice: smartCart.summary.totalPrice,
      },
      buyer: {
        buyerId: smartCart.request.buyerId,
        buyerName: smartCart.result.buyerName,
        personalizationNotes: smartCart.result.buyerPersonalizationNotes,
      },
      candidateProducts: context.deterministicRecommendations.map((recommendation) => ({
        cartRole: recommendation.item.cartRole,
        confidenceScore: recommendation.item.confidenceScore,
        deliveryLabel: recommendation.product.deliveryLabel,
        productId: recommendation.product.id,
        productName: recommendation.product.name,
        quantity: recommendation.item.quantity,
        reasons: recommendation.item.reasons,
        warnings: recommendation.item.warnings.map((warning) => ({
          severity: warning.severity,
          title: warning.title,
        })),
      })),
      prompt: smartCart.request.prompt,
      summary: {
        confidenceScore: smartCart.summary.confidenceScore,
        intentLabel: smartCart.summary.intentLabel,
        itemCount: smartCart.summary.itemCount,
        warningCount: smartCart.summary.warningCount,
      },
      warnings: smartCart.result.warnings.map((warning) => ({
        message: warning.message,
        severity: warning.severity,
        title: warning.title,
      })),
    },
    null,
    2,
  );
}

function createFallbackBuyerAgentModelBody(
  sourceSmartCart: BuyerSmartCartApiData,
  recommendations: BuyerAgentRecommendation[],
): BuyerAgentModelBody {
  const fallbackReasons = Object.fromEntries(
    recommendations.map((recommendation) => [
      recommendation.product.id,
      createRecommendationReason(recommendation.item, recommendation.product),
    ]),
  );
  const riskNotes = sourceSmartCart.result.warnings.slice(0, 3).map((warning) => warning.message);

  return {
    cartStrategySuggestion: "append",
    confirmationQuestion: "Bu seçkiyi sepete ekleyeyim mi?",
    messageContent: createAgentMessage(sourceSmartCart),
    rankedProductIds: recommendations.map((recommendation) => recommendation.product.id),
    recommendationReasons: fallbackReasons,
    riskNotes: riskNotes.length > 0 ? riskNotes : ["Bu seçki için kritik satın alma uyarısı yok."],
  };
}

function validateBuyerAgentModelBody(
  parsed: Record<string, unknown>,
  fallbackBody: BuyerAgentModelBody,
  context: BuyerAgentBuildContext,
): LlmJsonValidationResult<BuyerAgentModelBody> {
  const candidateIds = context.deterministicRecommendations.map((recommendation) => recommendation.product.id);
  const validIds = new Set(candidateIds);
  const rankedProductIds = normalizeRankedProductIds(parsed.rankedProductIds, candidateIds, validIds);
  const recommendationReasons = normalizeRecommendationReasons(parsed.recommendationReasons, fallbackBody.recommendationReasons, rankedProductIds);
  const normalizedBody = applyBuyerAgentBudgetGuardrails(
    {
      cartStrategySuggestion: normalizeCartStrategySuggestion(parsed.cartStrategySuggestion, fallbackBody.cartStrategySuggestion),
      confirmationQuestion: normalizeConfirmationQuestion(parsed.confirmationQuestion, fallbackBody.confirmationQuestion),
      messageContent: normalizeLlmString(parsed.messageContent, fallbackBody.messageContent),
      rankedProductIds,
      recommendationReasons,
      riskNotes: normalizeLlmStringArray(parsed.riskNotes, fallbackBody.riskNotes, 3),
    },
    fallbackBody,
    context.sourceSmartCart,
  );

  return {
    ok: true,
    value: applyBuyerAgentCatalogNarrativeGuardrails(normalizedBody, fallbackBody),
  };
}

function applyBuyerAgentCatalogNarrativeGuardrails(
  body: BuyerAgentModelBody,
  fallbackBody: BuyerAgentModelBody,
): BuyerAgentModelBody {
  return {
    ...body,
    confirmationQuestion: hasUnsupportedBuyerCatalogTerm(body.confirmationQuestion)
      ? fallbackBody.confirmationQuestion
      : body.confirmationQuestion,
    messageContent: hasUnsupportedBuyerCatalogTerm(body.messageContent)
      ? fallbackBody.messageContent
      : body.messageContent,
    recommendationReasons: Object.fromEntries(
      body.rankedProductIds.map((productId) => {
        const reason = body.recommendationReasons[productId] ?? "";

        return [
          productId,
          hasUnsupportedBuyerCatalogTerm(reason)
            ? fallbackBody.recommendationReasons[productId] ?? "Bu ürün katalog adayları içinden seçildi."
            : reason,
        ];
      }),
    ),
    riskNotes: body.riskNotes.map((note, index) =>
      hasUnsupportedBuyerCatalogTerm(note) ? fallbackBody.riskNotes[index] ?? "Katalog dışı ürün önerilmedi." : note,
    ),
  };
}

function rankRecommendations(
  recommendations: BuyerAgentRecommendation[],
  modelBody: BuyerAgentModelBody,
): BuyerAgentRecommendation[] {
  const recommendationById = new Map(recommendations.map((recommendation) => [recommendation.product.id, recommendation]));

  return modelBody.rankedProductIds
    .map((productId) => recommendationById.get(productId))
    .filter((recommendation): recommendation is BuyerAgentRecommendation => Boolean(recommendation));
}

function normalizeRankedProductIds(value: unknown, fallbackIds: string[], validIds: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return fallbackIds;
  }

  const ranked = value.reduce<string[]>((items, item) => {
    if (typeof item === "string" && validIds.has(item) && !items.includes(item)) {
      items.push(item);
    }

    return items;
  }, []);

  fallbackIds.forEach((productId) => {
    if (!ranked.includes(productId)) {
      ranked.push(productId);
    }
  });

  return ranked.length > 0 ? ranked : fallbackIds;
}

function normalizeRecommendationReasons(
  value: unknown,
  fallbackReasons: Record<string, string>,
  rankedProductIds: string[],
): Record<string, string> {
  const source = typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  return Object.fromEntries(
    rankedProductIds.map((productId) => [
      productId,
      normalizeLlmString(source[productId], fallbackReasons[productId] ?? "Bu ürün sepet rolüyle uyumlu olduğu için seçildi."),
    ]),
  );
}

function normalizeCartStrategySuggestion(value: unknown, fallback: BuyerAgentApplyStrategy): BuyerAgentApplyStrategy {
  return value === "append" || value === "replace" ? value : fallback;
}

function normalizeConfirmationQuestion(value: unknown, fallback: string): string {
  const normalized = normalizeLlmString(value, fallback);

  return normalized.toLocaleLowerCase("tr-TR").includes("sepete") ? normalized : fallback;
}

function applyBuyerAgentBudgetGuardrails(
  body: BuyerAgentModelBody,
  fallbackBody: BuyerAgentModelBody,
  smartCart: BuyerSmartCartApiData,
): BuyerAgentModelBody {
  if (smartCart.result.budget) {
    return body;
  }

  return {
    ...body,
    messageContent: guardNoBudgetClaim(body.messageContent, fallbackBody.messageContent),
    recommendationReasons: Object.fromEntries(
      body.rankedProductIds.map((productId) => [
        productId,
        guardNoBudgetClaim(body.recommendationReasons[productId] ?? "", fallbackBody.recommendationReasons[productId] ?? ""),
      ]),
    ),
    riskNotes: mergeSafeRiskNotes(body.riskNotes, fallbackBody.riskNotes),
  };
}

function guardNoBudgetClaim(value: string, fallback: string): string {
  return hasUnsupportedNoBudgetClaim(value) ? fallback : value;
}

function mergeSafeRiskNotes(modelNotes: string[], fallbackNotes: string[]): string[] {
  const safeModelNotes = modelNotes.filter((note) => !hasUnsupportedNoBudgetClaim(note));
  const merged = [...safeModelNotes, ...fallbackNotes].reduce<string[]>((items, note) => {
    if (!items.includes(note)) {
      items.push(note);
    }

    return items;
  }, []);

  return merged.slice(0, 3);
}

function hasUnsupportedNoBudgetClaim(value: string): boolean {
  const normalized = value.toLocaleLowerCase("tr-TR");

  if (!normalized.includes("bütçe")) {
    return false;
  }

  return [
    "%5 tolerans",
    "bütçe altında",
    "bütçe dahilinde",
    "bütçe içinde",
    "bütçe ile uyumlu",
    "bütçe limit",
    "bütçe sınır",
    "bütçe toleransı",
    "bütçeniz",
    "bütçeye",
    "bütçeyi aşıyor",
    "bütçeyi aşmıyor",
    "bütçenize",
    "bütçenizi",
  ].some((phrase) => normalized.includes(phrase));
}

function createAgentMessage(data: BuyerSmartCartApiData): string {
  const itemNames = data.result.selectedItems.map((item) => item.productName).slice(0, 3);
  const productPhrase = itemNames.length > 0 ? itemNames.join(", ") : "uygun ürünleri";

  return `${data.summary.intentLabel} için katalogdan ${data.summary.itemCount} ürün seçtim: ${productPhrase}. ${data.summary.budgetStatusLabel} ve güven skoru ${data.summary.confidenceScore}/100.`;
}

function createRecommendationReason(item: BuyerSmartCartItem, product: BuyerCatalogProductCard): string {
  return `${item.cartRole} rolü için seçildi; ${product.deliveryLabel.toLowerCase()} ve ${item.confidenceScore}/100 güven skoru taşıyor.`;
}

function mapSuggestions(
  suggestions: BuyerProductSuggestion[],
  productById: Map<string, BuyerCatalogProductCard>,
): BuyerAgentSuggestion[] {
  return suggestions.map((suggestion) => ({
    product: productById.get(suggestion.productId),
    suggestion,
  }));
}
