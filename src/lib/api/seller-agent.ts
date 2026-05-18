import {
  demoSellerId,
  getSellerActionsApiData,
  getSellerProductsApiData,
  sellerActionsEndpoint,
  type SellerActionListItem,
  type SellerActionsFocusKey,
  type SellerProductApiRow,
  type SellerProductLinkedAction,
} from "@/lib/api/seller";
import {
  createAgentExecutionTrace,
  createAgentRuntimeSnapshot,
  type AgentExecutionTrace,
  type AgentRuntimeSnapshot,
} from "@/lib/agents/runtime";
import {
  createSellerListingMutationPreview,
  sellerAgentListingApplyToolId,
  type SellerListingMutationDelta,
  type SellerListingMutationPreview,
  type SellerListingMutationValues,
} from "@/lib/agents/seller-listing-apply";
import {
  generateLlmJson,
  getConfiguredLlmModel,
  normalizeLlmString,
} from "@/lib/llm";
import type { LlmJsonValidationResult, LlmTextGenerationResult } from "@/lib/llm";

export const sellerAgentEndpoint = "/api/seller/agent";

export type SellerAgentFocusKey =
  | SellerActionsFocusKey
  | "at-risk";

export interface SellerAgentExample {
  id: string;
  label: string;
  helper: string;
  prompt: string;
  focus: SellerAgentFocusKey;
}

export interface SellerAgentRequest {
  sellerId?: string;
  prompt: string;
}

export interface SellerAgentApiContractMeta {
  envelope: "success/data/error";
  source: "seller-agent-deterministic-workflow";
  generatedAt: string;
  endpoint: typeof sellerAgentEndpoint;
  method: "POST";
}

export interface SellerAgentApiData {
  contract: SellerAgentApiContractMeta;
  request: Required<SellerAgentRequest>;
  activeFocus: SellerAgentFocusKey;
  message: {
    role: "assistant";
    headline: string;
    content: string;
    safetyNote: string;
  };
  summary: {
    focusLabel: string;
    productCount: number;
    actionCount: number;
    topProductScore: number;
    recommendedOwner: string;
  };
  productFindings: SellerAgentProductFinding[];
  actionSuggestions: SellerAgentActionSuggestion[];
  evidenceSummary: SellerAgentEvidenceItem[];
  nextSteps: SellerAgentNextStep[];
  draftPreview?: SellerAgentDraftPreview;
  source: {
    productsEndpoint: string;
    actionsEndpoint: string;
    routeHint: string;
  };
  runtime: AgentRuntimeSnapshot;
  orchestration: SellerAgentLlmOrchestration;
  agentTrace: AgentExecutionTrace;
}

export interface SellerAgentProductFinding {
  id: string;
  rank: number;
  score: number;
  product: SellerProductApiRow;
  reason: string;
  evidence: SellerAgentEvidenceItem[];
  linkedAction?: SellerProductLinkedAction;
}

export interface SellerAgentActionSuggestion {
  id: string;
  href: string;
  title: string;
  categoryLabel: string;
  priorityScore: number;
  expectedOutcome: string;
  primaryProduct?: SellerProductApiRow;
}

export interface SellerAgentEvidenceItem {
  label: string;
  value: string;
  helper: string;
  tone: "good" | "calm" | "warning" | "danger";
}

export interface SellerAgentNextStep {
  id: string;
  title: string;
  detail: string;
  href: string;
  ctaLabel: string;
  requiresApproval: boolean;
}

export interface SellerAgentDraftPreview extends SellerListingMutationPreview {
  title: string;
  before: string;
  after: string;
}

export interface SellerAgentLlmOrchestration {
  status: LlmTextGenerationResult["status"];
  provider: LlmTextGenerationResult["provider"];
  model: string;
  generatedAt: string;
  activeFocus: SellerAgentFocusKey;
  rankedProductIds: string[];
  rankedActionIds: string[];
  productReasons: Record<string, string>;
  actionReasons: Record<string, string>;
  draft: SellerAgentModelDraft;
  fallbackReason?: string;
}

export interface SellerAgentApiOptions {
  forceFallback?: boolean;
  modelTextOverride?: string;
}

export interface SellerAgentModelDraft {
  campaignLabel?: string;
  description?: string;
  price?: number;
  productId?: string;
  rationale?: string;
  title?: string;
}

interface SellerAgentModelBody {
  activeFocus: SellerAgentFocusKey;
  actionReasons: Record<string, string>;
  draft: SellerAgentModelDraft;
  messageContent: string;
  messageHeadline: string;
  nextStepDetails: Record<string, string>;
  productReasons: Record<string, string>;
  rankedActionIds: string[];
  rankedProductIds: string[];
  safetyNote: string;
}

interface SellerAgentBuildContext {
  actionSuggestions: SellerAgentActionSuggestion[];
  actionsFocus: SellerActionsFocusKey;
  activeFocus: SellerAgentFocusKey;
  fallbackBody: SellerAgentModelBody;
  normalizedRequest: Required<SellerAgentRequest>;
  productFindings: SellerAgentProductFinding[];
  recommendedOwner: string;
  runtime: AgentRuntimeSnapshot;
  topProductScore: number;
}

export interface SellerAgentValidationError {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export interface SellerAgentValidationSuccess {
  ok: true;
  value: Required<SellerAgentRequest>;
}

export type SellerAgentValidationResult =
  | SellerAgentValidationError
  | SellerAgentValidationSuccess;

const sellerAgentFocusKeys: SellerAgentFocusKey[] = [
  "all",
  "at-risk",
  "campaign",
  "content",
  "customer-voice",
  "growth",
  "inventory",
  "negative-reviews",
  "operations",
  "profitability",
  "return-risk",
  "returns",
  "slow-movers",
  "stock-risk",
];

export const sellerAgentExamples: SellerAgentExample[] = [
  {
    focus: "slow-movers",
    helper: "Satış hızı, dönüşüm ve linked action'a göre sırala",
    id: "slow-movers",
    label: "Satılmayan ürünler",
    prompt: "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
  },
  {
    focus: "negative-reviews",
    helper: "Tekrar eden itirazları ürün ve action ile eşleştir",
    id: "negative-reviews",
    label: "Negatif yorumlar",
    prompt: "Negatif yorum gelen ürünleri grupla, hangi aksiyonu önce yapmalıyım?",
  },
  {
    focus: "stock-risk",
    helper: "Reorder point ve vitrin riskini birlikte göster",
    id: "stock-risk",
    label: "Stok riski",
    prompt: "Stok riski olan ürünleri göster ve bugün ne yapacağımı sırala.",
  },
  {
    focus: "return-risk",
    helper: "İade baskısı, beklenti farkı ve ürün sağlığına bak",
    id: "return-risk",
    label: "İade riski",
    prompt: "İade riski taşıyan ürünlerde hangi açıklama ve operasyon adımı gerekir?",
  },
];

export function getDefaultSellerAgentApiData(): SellerAgentApiData {
  return getDeterministicSellerAgentApiData({
    prompt: sellerAgentExamples[0].prompt,
    sellerId: demoSellerId,
  });
}

export function validateSellerAgentRequest(rawInput: unknown): SellerAgentValidationResult {
  if (!isRecord(rawInput)) {
    return {
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      ok: false,
      status: 400,
    };
  }

  const prompt = typeof rawInput.prompt === "string" ? rawInput.prompt.trim() : "";

  if (!prompt) {
    return {
      code: "PROMPT_REQUIRED",
      message: "Seller Agent için bir satıcı komutu yazılmalı.",
      ok: false,
      status: 400,
    };
  }

  if (prompt.length > 360) {
    return {
      code: "PROMPT_TOO_LONG",
      message: "Seller Agent komutu en fazla 360 karakter olmalı.",
      ok: false,
      status: 400,
    };
  }

  const sellerId = typeof rawInput.sellerId === "string" && rawInput.sellerId.trim()
    ? rawInput.sellerId.trim()
    : demoSellerId;

  return {
    ok: true,
    value: {
      prompt,
      sellerId,
    },
  };
}

export async function getSellerAgentApiData(
  request: SellerAgentRequest,
  options: SellerAgentApiOptions = {},
): Promise<SellerAgentApiData> {
  const initialContext = createSellerAgentBuildContext(request);
  const llmResult = await generateLlmJson({
    fallbackValue: initialContext.fallbackBody,
    forceFallback: options.forceFallback,
    input: createSellerAgentModelInput(initialContext),
    instructions: createSellerAgentModelInstructions(),
    maxOutputTokens: 850,
    metadata: {
      focus: initialContext.activeFocus,
      seller_id: initialContext.normalizedRequest.sellerId,
      task: "seller_agent_focus_action_draft_orchestration",
    },
    modelTextOverride: options.modelTextOverride,
    validate: (value, fallbackValue) => validateSellerAgentModelBody(value, fallbackValue, initialContext),
  });
  const context = llmResult.value.activeFocus === initialContext.activeFocus
    ? initialContext
    : createSellerAgentBuildContext(request, llmResult.value.activeFocus);
  const modelBody = context === initialContext
    ? llmResult.value
    : adaptSellerAgentModelBodyToContext(llmResult.value, context);

  return composeSellerAgentApiData(context, modelBody, {
    fallbackReason: llmResult.fallbackReason,
    generatedAt: llmResult.generatedAt,
    model: llmResult.model,
    provider: llmResult.provider,
    status: llmResult.status,
  });
}

function getDeterministicSellerAgentApiData(request: SellerAgentRequest): SellerAgentApiData {
  const context = createSellerAgentBuildContext(request);

  return composeSellerAgentApiData(context, context.fallbackBody, {
    fallbackReason: "STATIC_SELLER_AGENT_PREVIEW: İlk render canlı LLM çağrısı yapmadan deterministik contract kullanır.",
    generatedAt: new Date().toISOString(),
    model: getConfiguredLlmModel(),
    provider: "deterministic",
    status: "fallback",
  });
}

function createSellerAgentBuildContext(
  request: SellerAgentRequest,
  focusOverride?: SellerAgentFocusKey,
): SellerAgentBuildContext {
  const normalizedRequest = {
    prompt: request.prompt.trim(),
    sellerId: request.sellerId?.trim() || demoSellerId,
  };
  const activeFocus = focusOverride ?? inferSellerAgentFocus(normalizedRequest.prompt);
  const productContract = getSellerProductsApiData(normalizedRequest.sellerId);
  const products = productContract?.products ?? [];
  const focusedProducts = filterProductsForAgent(products, activeFocus);
  const actionsFocus = toActionsFocus(activeFocus);
  const actionsContract = getSellerActionsApiData(normalizedRequest.sellerId, { focus: actionsFocus });
  const actionCards = actionsContract?.actionCards ?? [];
  const actionProductIds = new Set(actionCards.flatMap((card) => card.affectedProducts.map((product) => product.id)));
  const actionMatchedProducts = focusedProducts.filter((product) => actionProductIds.has(product.id));
  const candidateProducts = (actionMatchedProducts.length >= 3 ? actionMatchedProducts : focusedProducts).slice(0, 6);
  const productFindings = candidateProducts
    .map((product, index) => createProductFinding(product, index, activeFocus))
    .sort((first, second) => second.score - first.score)
    .slice(0, 4)
    .map((finding, index) => ({ ...finding, rank: index + 1 }));
  const actionSuggestions = actionCards.slice(0, 3).map(createActionSuggestion);
  const topProductScore = productFindings[0]?.score ?? 0;
  const recommendedOwner =
    actionCards[0]?.action.todayChecklist[0]?.owner ??
    productFindings[0]?.linkedAction?.ownerLabel ??
    "operasyon";

  return {
    actionSuggestions,
    actionsFocus,
    activeFocus,
    fallbackBody: createFallbackSellerAgentModelBody(
      activeFocus,
      productFindings,
      actionSuggestions,
      normalizedRequest.sellerId,
    ),
    normalizedRequest,
    productFindings,
    recommendedOwner,
    runtime: createAgentRuntimeSnapshot({
      actorId: normalizedRequest.sellerId,
      prompt: normalizedRequest.prompt,
      role: "seller",
      routeContext: "/seller/agent",
      surface: "route",
    }),
    topProductScore,
  };
}

function composeSellerAgentApiData(
  context: SellerAgentBuildContext,
  modelBody: SellerAgentModelBody,
  modelMeta: Pick<SellerAgentLlmOrchestration, "fallbackReason" | "generatedAt" | "model" | "provider" | "status">,
): SellerAgentApiData {
  const productFindings = rankProductFindings(context.productFindings, modelBody)
    .map((finding, index) => ({
      ...finding,
      rank: index + 1,
      reason: modelBody.productReasons[finding.product.id] ?? finding.reason,
    }));
  const actionSuggestions = rankActionSuggestions(context.actionSuggestions, modelBody)
    .map((action) => ({
      ...action,
      expectedOutcome: modelBody.actionReasons[action.id] ?? action.expectedOutcome,
    }));
  const nextSteps = createNextSteps(productFindings, actionSuggestions, context.activeFocus)
    .map((step) => ({
      ...step,
      detail: modelBody.nextStepDetails[step.id] ?? step.detail,
    }));
  const draftPreview = createDraftPreview(
    productFindings[0],
    actionSuggestions[0],
    context.activeFocus,
    context.normalizedRequest.sellerId,
    modelBody.draft,
  );

  return {
    activeFocus: context.activeFocus,
    agentTrace: createSellerAgentTrace(context, productFindings, actionSuggestions, draftPreview, modelMeta),
    actionSuggestions,
    contract: {
      endpoint: sellerAgentEndpoint,
      envelope: "success/data/error",
      generatedAt: modelMeta.generatedAt,
      method: "POST",
      source: "seller-agent-deterministic-workflow",
    },
    draftPreview,
    evidenceSummary: createEvidenceSummary(productFindings, actionSuggestions, context.activeFocus),
    message: {
      content: modelBody.messageContent,
      headline: modelBody.messageHeadline,
      role: "assistant",
      safetyNote: modelBody.safetyNote,
    },
    nextSteps,
    orchestration: {
      actionReasons: modelBody.actionReasons,
      activeFocus: context.activeFocus,
      draft: modelBody.draft,
      fallbackReason: modelMeta.fallbackReason,
      generatedAt: modelMeta.generatedAt,
      model: modelMeta.model,
      productReasons: modelBody.productReasons,
      provider: modelMeta.provider,
      rankedActionIds: modelBody.rankedActionIds,
      rankedProductIds: modelBody.rankedProductIds,
      status: modelMeta.status,
    },
    productFindings,
    request: context.normalizedRequest,
    source: {
      actionsEndpoint: context.actionsFocus === "all" ? sellerActionsEndpoint : `${sellerActionsEndpoint}?focus=${context.actionsFocus}`,
      productsEndpoint: getProductsEndpoint(context.activeFocus),
      routeHint: context.activeFocus === "all" ? "/seller/actions" : `/seller/actions?focus=${context.actionsFocus}`,
    },
    runtime: context.runtime,
    summary: {
      actionCount: actionSuggestions.length,
      focusLabel: getSellerAgentFocusLabel(context.activeFocus),
      productCount: productFindings.length,
      recommendedOwner: context.recommendedOwner,
      topProductScore: context.topProductScore,
    },
  };
}

function createSellerAgentTrace(
  context: SellerAgentBuildContext,
  productFindings: SellerAgentProductFinding[],
  actionSuggestions: SellerAgentActionSuggestion[],
  draftPreview: SellerAgentDraftPreview | undefined,
  modelMeta: Pick<SellerAgentLlmOrchestration, "fallbackReason" | "generatedAt" | "model" | "provider" | "status">,
): AgentExecutionTrace {
  const llmStatus = modelMeta.status === "generated" ? "completed" : "guarded";

  return createAgentExecutionTrace({
    generatedAt: modelMeta.generatedAt,
    runtime: context.runtime,
    summary: "Seller Agent ürün, aksiyon, onay ve taslak adımlarını tek işlem izinde gösterir.",
    items: [
      {
        detail: `${context.normalizedRequest.sellerId} için ürün, aksiyon, alıcı sinyali ve izin bilgisi okundu.`,
        endpoint: getProductsEndpoint(context.activeFocus),
        id: "seller-context-read",
        label: "Satıcı verisi okundu",
        layer: "context",
        status: "completed",
      },
      {
        detail: `${productFindings.length} ürün ve ${actionSuggestions.length} aksiyon sağlık ve risk sinyaliyle sıralandı.`,
        endpoint: context.actionsFocus === "all" ? sellerActionsEndpoint : `${sellerActionsEndpoint}?focus=${context.actionsFocus}`,
        id: "seller-risk-workflow",
        label: "Risk sıralaması hazırlandı",
        layer: "workflow",
        status: "completed",
      },
      {
        detail: modelMeta.status === "generated"
          ? "Odak, aksiyon gerekçesi ve listeleme taslağı üretildi."
          : "Güvenli varsayılan yanıtla devam edildi.",
        id: "seller-llm-orchestration",
        label: "Öneri taslağı üretildi",
        layer: "llm",
        status: llmStatus,
      },
      {
        detail: "Katalog dışı ürün veya aksiyon id'leri temizlendi; taslak uygulanmadan önce güvenli sınıra alındı.",
        id: "seller-guardrail-validation",
        label: "Güvenlik sınırı doğrulandı",
        layer: "guardrail",
        status: "guarded",
      },
      {
        detail: draftPreview
          ? `${draftPreview.productName} listeleme değişikliği satıcı onayı bekler.`
          : "Uygulanacak listeleme taslağı yok; değişiklik kapalı kalır.",
        endpoint: draftPreview?.endpoint ?? sellerAgentEndpoint,
        id: "seller-approval-boundary",
        label: "Listeleme onayı bekleniyor",
        layer: "approval",
        requiresApproval: Boolean(draftPreview?.requiresApproval),
        status: draftPreview ? "pending" : "guarded",
        toolId: draftPreview?.toolId ?? sellerAgentListingApplyToolId,
      },
      {
        detail: draftPreview
          ? "Onay verildiğinde işlem geçmişi ve geri alma hazır olur."
          : "Taslak olmadığı için uygulama aracı kapalı kalır.",
        endpoint: draftPreview?.endpoint ?? sellerAgentEndpoint,
        id: "seller-listing-apply-tool-ready",
        label: "Uygulama aracı hazır",
        layer: "tool",
        requiresApproval: true,
        status: draftPreview ? "ready" : "guarded",
        toolId: sellerAgentListingApplyToolId,
      },
    ],
  });
}

function createSellerAgentModelInstructions(): string {
  return [
    "Alışveriş Arkadaşım satıcı Agent focus/action/draft orchestration katmanısın.",
    "Sadece verilen candidateProducts productId ve candidateActions actionId değerlerini kullan; ürün, fiyat, stok veya action uydurma.",
    "Satıcı komutundan activeFocus seç, ürünleri ve action'ları ticari önceliğe göre sırala, kısa gerekçeleri yaz.",
    "draft yalnızca onay bekleyen listing mutation taslağıdır; fiyat, başlık, açıklama veya kampanya uygulanmış gibi konuşma.",
    "draft.price aday ürün currentPrice değerinin yüzde 70 ile yüzde 115 aralığında olmalı.",
    "safetyNote mutlaka Onay kelimesini içersin ve onaysız değişiklik yapmayacağını söylesin.",
    "Kesinlikle geçerli JSON dön. Markdown, açıklama veya code fence kullanma.",
    'JSON shape: {"activeFocus":"slow-movers","messageHeadline":"...","messageContent":"...","safetyNote":"...","rankedProductIds":["..."],"rankedActionIds":["..."],"productReasons":{"productId":"..."},"actionReasons":{"actionId":"..."},"nextStepDetails":{"open-products":"...","open-action":"...","approval-boundary":"..."},"draft":{"productId":"...","title":"...","description":"...","campaignLabel":"...","price":123,"rationale":"..."}}',
  ].join("\n");
}

function createSellerAgentModelInput(context: SellerAgentBuildContext): string {
  return JSON.stringify(
    {
      availableFocuses: sellerAgentFocusKeys.map((focus) => ({
        focus,
        label: getSellerAgentFocusLabel(focus),
      })),
      candidateActions: context.actionSuggestions.map((action) => ({
        actionId: action.id,
        categoryLabel: action.categoryLabel,
        expectedOutcome: action.expectedOutcome,
        priorityScore: action.priorityScore,
        primaryProductId: action.primaryProduct?.id,
        title: action.title,
      })),
      candidateProducts: context.productFindings.map((finding) => ({
        currentPrice: finding.product.price,
        focusTags: finding.product.focusTags,
        healthLabel: finding.product.healthLabel,
        healthScore: finding.product.healthScore,
        linkedActionTitle: finding.linkedAction?.title,
        orders30d: finding.product.orders30d,
        productId: finding.product.id,
        productName: finding.product.name,
        reason: finding.reason,
        revenue30d: finding.product.revenue30d,
        riskSignals: finding.product.riskSignals.map((signal) => ({
          helper: signal.helper,
          label: signal.label,
          tone: signal.tone,
        })),
        score: finding.score,
        stock: {
          available: finding.product.availableStock,
          label: finding.product.stockStatusLabel,
          reorderPoint: finding.product.reorderPoint,
          status: finding.product.stockStatus,
        },
      })),
      inferredFocus: context.activeFocus,
      prompt: context.normalizedRequest.prompt,
      sellerId: context.normalizedRequest.sellerId,
    },
    null,
    2,
  );
}

function createFallbackSellerAgentModelBody(
  activeFocus: SellerAgentFocusKey,
  productFindings: SellerAgentProductFinding[],
  actionSuggestions: SellerAgentActionSuggestion[],
  sellerId: string,
): SellerAgentModelBody {
  const draftPreview = createDraftPreview(productFindings[0], actionSuggestions[0], activeFocus, sellerId);

  return {
    activeFocus,
    actionReasons: Object.fromEntries(actionSuggestions.map((action) => [action.id, action.expectedOutcome])),
    draft: draftPreview
      ? {
          campaignLabel: draftPreview.afterListing.campaignLabel,
          description: draftPreview.afterListing.description,
          price: draftPreview.afterListing.price,
          productId: draftPreview.productId,
          rationale: draftPreview.helper,
          title: draftPreview.afterListing.title,
        }
      : {},
    messageContent: createAgentContent(productFindings, actionSuggestions, activeFocus),
    messageHeadline: createAgentHeadline(activeFocus),
    nextStepDetails: Object.fromEntries(
      createNextSteps(productFindings, actionSuggestions, activeFocus).map((step) => [step.id, step.detail]),
    ),
    productReasons: Object.fromEntries(productFindings.map((finding) => [finding.product.id, finding.reason])),
    rankedActionIds: actionSuggestions.map((action) => action.id),
    rankedProductIds: productFindings.map((finding) => finding.product.id),
    safetyNote: "Onay vermeden listeleme, fiyat, kampanya veya stok alanlarında değişiklik yapmam.",
  };
}

function validateSellerAgentModelBody(
  parsed: Record<string, unknown>,
  fallbackBody: SellerAgentModelBody,
  context: SellerAgentBuildContext,
): LlmJsonValidationResult<SellerAgentModelBody> {
  const productIds = context.productFindings.map((finding) => finding.product.id);
  const actionIds = context.actionSuggestions.map((action) => action.id);
  const rankedProductIds = normalizeRankedIds(parsed.rankedProductIds, fallbackBody.rankedProductIds, new Set(productIds));
  const rankedActionIds = normalizeRankedIds(parsed.rankedActionIds, fallbackBody.rankedActionIds, new Set(actionIds));

  return {
    ok: true,
    value: {
      activeFocus: normalizeSellerAgentFocusKey(parsed.activeFocus, fallbackBody.activeFocus),
      actionReasons: normalizeTextMapById(parsed.actionReasons, fallbackBody.actionReasons, rankedActionIds),
      draft: normalizeSellerAgentDraft(parsed.draft, fallbackBody.draft, rankedProductIds[0], context),
      messageContent: normalizeLimitedLlmString(parsed.messageContent, fallbackBody.messageContent, 360),
      messageHeadline: normalizeLimitedLlmString(parsed.messageHeadline, fallbackBody.messageHeadline, 120),
      nextStepDetails: normalizeTextMapById(parsed.nextStepDetails, fallbackBody.nextStepDetails, Object.keys(fallbackBody.nextStepDetails)),
      productReasons: normalizeTextMapById(parsed.productReasons, fallbackBody.productReasons, rankedProductIds),
      rankedActionIds,
      rankedProductIds,
      safetyNote: normalizeSellerAgentSafetyNote(parsed.safetyNote, fallbackBody.safetyNote),
    },
  };
}

function adaptSellerAgentModelBodyToContext(
  modelBody: SellerAgentModelBody,
  context: SellerAgentBuildContext,
): SellerAgentModelBody {
  const validation = validateSellerAgentModelBody(
    {
      activeFocus: context.activeFocus,
      actionReasons: modelBody.actionReasons,
      draft: modelBody.draft,
      messageContent: modelBody.messageContent,
      messageHeadline: modelBody.messageHeadline,
      nextStepDetails: modelBody.nextStepDetails,
      productReasons: modelBody.productReasons,
      rankedActionIds: modelBody.rankedActionIds,
      rankedProductIds: modelBody.rankedProductIds,
      safetyNote: modelBody.safetyNote,
    },
    context.fallbackBody,
    context,
  );

  return validation.ok ? validation.value : context.fallbackBody;
}

function rankProductFindings(
  findings: SellerAgentProductFinding[],
  modelBody: SellerAgentModelBody,
): SellerAgentProductFinding[] {
  const findingById = new Map(findings.map((finding) => [finding.product.id, finding]));

  return modelBody.rankedProductIds
    .map((productId) => findingById.get(productId))
    .filter((finding): finding is SellerAgentProductFinding => Boolean(finding));
}

function rankActionSuggestions(
  actions: SellerAgentActionSuggestion[],
  modelBody: SellerAgentModelBody,
): SellerAgentActionSuggestion[] {
  const actionById = new Map(actions.map((action) => [action.id, action]));

  return modelBody.rankedActionIds
    .map((actionId) => actionById.get(actionId))
    .filter((action): action is SellerAgentActionSuggestion => Boolean(action));
}

function normalizeRankedIds(value: unknown, fallbackIds: string[], validIds: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return fallbackIds;
  }

  const ranked = value.reduce<string[]>((items, item) => {
    if (typeof item === "string" && validIds.has(item) && !items.includes(item)) {
      items.push(item);
    }

    return items;
  }, []);

  fallbackIds.forEach((id) => {
    if (!ranked.includes(id)) {
      ranked.push(id);
    }
  });

  return ranked.length > 0 ? ranked : fallbackIds;
}

function normalizeTextMapById(
  value: unknown,
  fallbackMap: Record<string, string>,
  ids: string[],
): Record<string, string> {
  const source = isRecord(value) ? value : {};

  return Object.fromEntries(
    ids.map((id) => [
      id,
      normalizeLimitedLlmString(source[id], fallbackMap[id] ?? "Agent kanıtına göre önceliklendirildi.", 240),
    ]),
  );
}

function normalizeSellerAgentFocusKey(value: unknown, fallback: SellerAgentFocusKey): SellerAgentFocusKey {
  return typeof value === "string" && isSellerAgentFocusKey(value) ? value : fallback;
}

function normalizeSellerAgentDraft(
  value: unknown,
  fallback: SellerAgentModelDraft,
  topProductId: string | undefined,
  context: SellerAgentBuildContext,
): SellerAgentModelDraft {
  const source = isRecord(value) ? value : {};
  const productId = topProductId ?? fallback.productId;
  const product = productId
    ? context.productFindings.find((finding) => finding.product.id === productId)?.product
    : undefined;
  const draft: SellerAgentModelDraft = {};
  const title = normalizeDraftString(source.title, fallback.title, 3, 140);
  const description = normalizeDraftString(source.description, fallback.description, 12, 420);
  const campaignLabel = normalizeDraftString(source.campaignLabel, fallback.campaignLabel, 3, 100);
  const rationale = normalizeDraftString(source.rationale, fallback.rationale, 8, 180);
  const price = normalizeDraftPrice(source.price, fallback.price, product?.price);

  if (productId) {
    draft.productId = productId;
  }

  if (title) {
    draft.title = title;
  }

  if (description) {
    draft.description = description;
  }

  if (campaignLabel) {
    draft.campaignLabel = campaignLabel;
  }

  if (typeof price === "number") {
    draft.price = price;
  }

  if (rationale) {
    draft.rationale = rationale;
  }

  return draft;
}

function normalizeDraftString(
  value: unknown,
  fallback: string | undefined,
  minLength: number,
  maxLength: number,
): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (normalized.length >= minLength && normalized.length <= maxLength) {
    return normalized;
  }

  return fallback && fallback.length >= minLength && fallback.length <= maxLength ? fallback : undefined;
}

function normalizeDraftPrice(
  value: unknown,
  fallback: number | undefined,
  currentPrice: number | undefined,
): number | undefined {
  const price = Number(value);
  const lowerBound = currentPrice ? currentPrice * 0.7 : 1;
  const upperBound = currentPrice ? currentPrice * 1.15 : Number.MAX_SAFE_INTEGER;

  if (Number.isFinite(price) && price > 0 && price >= lowerBound && price <= upperBound) {
    return Math.round(price);
  }

  return typeof fallback === "number" && fallback > 0 ? Math.round(fallback) : undefined;
}

function normalizeLimitedLlmString(value: unknown, fallback: string, maxLength: number): string {
  const normalized = normalizeLlmString(value, fallback);

  return normalized.length <= maxLength ? normalized : fallback;
}

function normalizeSellerAgentSafetyNote(value: unknown, fallback: string): string {
  const normalized = normalizeLimitedLlmString(value, fallback, 180);

  return normalized.toLocaleLowerCase("tr-TR").includes("onay") ? normalized : fallback;
}

function inferSellerAgentFocus(prompt: string): SellerAgentFocusKey {
  const normalizedPrompt = prompt.toLocaleLowerCase("tr-TR");

  if (/(satılmayan|satilmayan|yavaş|yavas|slow|dönüşüm|donusum|satış hızı|satis hizi)/u.test(normalizedPrompt)) {
    return "slow-movers";
  }

  if (/(negatif|yorum|şikayet|sikayet|puan|müşteri sesi|musteri sesi)/u.test(normalizedPrompt)) {
    return "negative-reviews";
  }

  if (/(stok|tedarik|reorder|kritik stok)/u.test(normalizedPrompt)) {
    return "stock-risk";
  }

  if (/(iade|return|beklenti)/u.test(normalizedPrompt)) {
    return "return-risk";
  }

  if (/(listeleme|başlık|baslik|açıklama|aciklama|pdp|içerik|icerik)/u.test(normalizedPrompt)) {
    return "content";
  }

  if (/(marj|kâr|kar|maliyet|fiyat|karlılık|karlilik)/u.test(normalizedPrompt)) {
    return "profitability";
  }

  if (/(risk|öncelik|oncelik|sırala|sirala)/u.test(normalizedPrompt)) {
    return "at-risk";
  }

  return "all";
}

function filterProductsForAgent(
  products: SellerProductApiRow[],
  focus: SellerAgentFocusKey,
): SellerProductApiRow[] {
  if (focus === "all") {
    return products
      .slice()
      .sort((first, second) => getProductAgentScore(second, focus) - getProductAgentScore(first, focus));
  }

  if (focus === "content" || focus === "profitability") {
    return products
      .filter((product) => product.linkedAction)
      .sort((first, second) => getProductAgentScore(second, focus) - getProductAgentScore(first, focus));
  }

  return products
    .filter((product) => product.focusTags.includes(focus as never))
    .sort((first, second) => getProductAgentScore(second, focus) - getProductAgentScore(first, focus));
}

function toActionsFocus(focus: SellerAgentFocusKey): SellerActionsFocusKey {
  if (focus === "at-risk") {
    return "all";
  }

  return focus;
}

function createProductFinding(
  product: SellerProductApiRow,
  index: number,
  focus: SellerAgentFocusKey,
): SellerAgentProductFinding {
  const primarySignal = product.riskSignals[0];

  return {
    evidence: [
      {
        helper: product.healthLabel,
        label: "Sağlık",
        tone: product.healthScore < 70 ? "danger" : "calm",
        value: `${product.healthScore}/100`,
      },
      {
        helper: `${product.reorderPoint} adet eşik`,
        label: "Stok",
        tone: product.stockStatus === "risk" ? "danger" : product.stockStatus === "watch" ? "warning" : "good",
        value: `${product.availableStock} adet`,
      },
      {
        helper: `${formatTryCompact(product.revenue30d)} gelir`,
        label: "Satış",
        tone: product.orders30d < 12 ? "warning" : "calm",
        value: `${product.orders30d} sipariş`,
      },
    ],
    id: product.id,
    linkedAction: product.linkedAction,
    product,
    rank: index + 1,
    reason: createProductReason(product, focus, primarySignal?.label),
    score: getProductAgentScore(product, focus),
  };
}

function createActionSuggestion(card: SellerActionListItem): SellerAgentActionSuggestion {
  return {
    categoryLabel: card.action.categoryLabel,
    expectedOutcome: card.action.expectedOutcome,
    href: card.href,
    id: card.id,
    primaryProduct: card.primaryProduct,
    priorityScore: card.action.priorityScore,
    title: card.action.title,
  };
}

function createEvidenceSummary(
  findings: SellerAgentProductFinding[],
  actions: SellerAgentActionSuggestion[],
  focus: SellerAgentFocusKey,
): SellerAgentEvidenceItem[] {
  const averageHealth = findings.length > 0
    ? Math.round(findings.reduce((sum, finding) => sum + finding.product.healthScore, 0) / findings.length)
    : 0;
  const totalRevenue = findings.reduce((sum, finding) => sum + finding.product.revenue30d, 0);

  return [
    {
      helper: `${findings.length} ürün Agent sıralamasında`,
      label: getSellerAgentFocusLabel(focus),
      tone: focus === "all" ? "calm" : "warning",
      value: String(findings.length),
    },
    {
      helper: "İlk 4 ürünün ortalaması",
      label: "Sağlık",
      tone: averageHealth < 70 ? "danger" : "calm",
      value: `${averageHealth}/100`,
    },
    {
      helper: "Bağlı seller action sayısı",
      label: "Aksiyon",
      tone: actions.length > 0 ? "good" : "warning",
      value: String(actions.length),
    },
    {
      helper: "Görünür ticari hacim",
      label: "Gelir",
      tone: "calm",
      value: formatTryCompact(totalRevenue),
    },
  ];
}

function createNextSteps(
  findings: SellerAgentProductFinding[],
  actions: SellerAgentActionSuggestion[],
  focus: SellerAgentFocusKey,
): SellerAgentNextStep[] {
  const primaryFinding = findings[0];
  const primaryAction = actions[0];

  return [
    {
      ctaLabel: "Ürünleri filtrele",
      detail: `${getSellerAgentFocusLabel(focus)} görünümünde ilgili ürün satırlarını aç.`,
      href: getProductsHref(focus),
      id: "open-products",
      requiresApproval: false,
      title: "Ürün kanıtını aç",
    },
    {
      ctaLabel: "Aksiyon detayını aç",
      detail: primaryAction?.expectedOutcome ?? "En yüksek öncelikli seller action detayını incele.",
      href: primaryAction?.href ?? "/seller/actions",
      id: "open-action",
      requiresApproval: false,
      title: primaryAction?.title ?? "Aksiyon kuyruğunu aç",
    },
    {
      ctaLabel: "Önizleme beklemede",
      detail: primaryFinding
        ? `${primaryFinding.product.name} için before/after listeleme taslağı üretilebilir, fakat onay olmadan uygulanmaz.`
        : "Mutation taslağı yalnızca ürün ve action kanıtı oluştuktan sonra hazırlanır.",
      href: "/seller/profile",
      id: "approval-boundary",
      requiresApproval: true,
      title: "Onay sınırını koru",
    },
  ];
}

function createDraftPreview(
  finding: SellerAgentProductFinding | undefined,
  action: SellerAgentActionSuggestion | undefined,
  focus: SellerAgentFocusKey,
  sellerId: string,
  modelDraft?: SellerAgentModelDraft,
): SellerAgentDraftPreview | undefined {
  if (!finding) {
    return undefined;
  }

  const listingPreview = createSellerListingMutationPreview({
    actionId: action?.id,
    actionTitle: action?.title,
    focusLabel: getSellerAgentFocusLabel(focus),
    product: finding.product,
    sellerId,
  });
  const preview = applyModelDraftToPreview(listingPreview, modelDraft);

  return {
    ...preview,
    after: formatListingPreviewLine(preview.afterListing),
    before: formatListingPreviewLine(preview.beforeListing),
    title: modelDraft?.title ? "Listeleme taslağı önizlemesi" : "Onaylı listeleme önizlemesi",
  };
}

function applyModelDraftToPreview(
  preview: SellerListingMutationPreview,
  modelDraft: SellerAgentModelDraft | undefined,
): SellerListingMutationPreview {
  if (!modelDraft || modelDraft.productId !== preview.productId) {
    return preview;
  }

  const afterListing: SellerListingMutationValues = {
    campaignLabel: modelDraft.campaignLabel ?? preview.afterListing.campaignLabel,
    description: modelDraft.description ?? preview.afterListing.description,
    price: modelDraft.price ?? preview.afterListing.price,
    title: modelDraft.title ?? preview.afterListing.title,
  };
  const delta = createListingDelta(preview.beforeListing, afterListing);
  const reason = modelDraft.rationale ?? preview.applyRequest.reason;

  return {
    ...preview,
    afterListing,
    applyRequest: {
      ...preview.applyRequest,
      mutation: afterListing,
      reason,
    },
    delta,
    helper: reason ?? preview.helper,
    summary: {
      campaignLabel: afterListing.campaignLabel,
      fieldCount: delta.length,
      mutationLabel: `${delta.length} alan onay sonrası güncellenecek`,
      priceDelta: afterListing.price - preview.beforeListing.price,
    },
  };
}

function createListingDelta(
  before: SellerListingMutationValues,
  after: SellerListingMutationValues,
): SellerListingMutationDelta[] {
  const fields: Array<{ field: SellerListingMutationDelta["field"]; label: string }> = [
    { field: "title", label: "Başlık" },
    { field: "description", label: "Açıklama" },
    { field: "price", label: "Fiyat" },
    { field: "campaignLabel", label: "Kampanya" },
  ];

  return fields
    .filter(({ field }) => before[field] !== after[field])
    .map(({ field, label }) => ({
      after: stringifyListingValue(after[field]),
      before: stringifyListingValue(before[field]),
      field,
      label,
    }));
}

function formatListingPreviewLine(listing: SellerListingMutationValues): string {
  return `${listing.title}. ${listing.campaignLabel}; ${formatTryCompact(listing.price)}.`;
}

function createAgentHeadline(focus: SellerAgentFocusKey): string {
  if (focus === "all") {
    return "Öncelikli satıcı işlerini ürün kanıtıyla sıraladım.";
  }

  return `${getSellerAgentFocusLabel(focus)} için ilk sıradaki ürünleri ayırdım.`;
}

function createAgentContent(
  findings: SellerAgentProductFinding[],
  actions: SellerAgentActionSuggestion[],
  focus: SellerAgentFocusKey,
): string {
  const firstProduct = findings[0]?.product.name ?? "ilgili ürün";
  const actionTitle = actions[0]?.title ?? "aksiyon kuyruğu";

  if (findings.length === 0) {
    return "Bu komut için yeterli ürün kanıtı bulamadım. Ürünler veya aksiyonlar sayfasından daha dar bir kategori seçebilirsin.";
  }

  return `${getSellerAgentFocusLabel(focus)} görünümünde ${findings.length} ürünü sağlık, stok, satış ve yorum sinyaliyle sıraladım. İlk aday ${firstProduct}; bağlı öneri ${actionTitle}.`;
}

function createProductReason(
  product: SellerProductApiRow,
  focus: SellerAgentFocusKey,
  signalLabel?: string,
): string {
  if (focus === "slow-movers") {
    return `${product.orders30d} sipariş ve ${formatPercent(product.conversionRate)} dönüşüm, satış hızının baskılandığını gösteriyor.`;
  }

  if (focus === "negative-reviews") {
    return `${product.reviewCount} yorum ve ${product.ratingAverage.toFixed(1)} puan, müşteri itirazının görünür olduğunu gösteriyor.`;
  }

  if (focus === "stock-risk") {
    return `${product.availableStock}/${product.reorderPoint} stok seviyesi vitrin baskısı büyümeden aksiyon gerektiriyor.`;
  }

  if (focus === "return-risk") {
    return `${signalLabel ?? "İade riski"} ürün sayfası ve operasyon beklentisinin netleşmesi gerektiğini gösteriyor.`;
  }

  if (focus === "content") {
    return `${product.healthLabel}; listeleme metni ürün risk sinyalini yeterince karşılamıyor.`;
  }

  if (focus === "profitability") {
    return `${formatTryCompact(product.revenue30d)} gelir hacmi marj ve kampanya kararının kontrollü verilmesini gerektiriyor.`;
  }

  return `${signalLabel ?? product.stockStatusLabel} ve ${product.healthScore}/100 sağlık skoru ürünü Agent sıralamasında öne çıkarıyor.`;
}

function getProductAgentScore(product: SellerProductApiRow, focus: SellerAgentFocusKey): number {
  const healthRisk = 100 - product.healthScore;
  const signalWeight = product.riskSignals.length * 8;
  const actionWeight = product.linkedAction ? Math.round(product.linkedAction.priorityScore / 5) : 0;
  const stockWeight = focus === "stock-risk" && product.focusTags.includes("stock-risk") ? 18 : 0;
  const reviewWeight = focus === "negative-reviews" ? Math.min(18, product.reviewCount / 4) : 0;
  const slowMoverWeight = focus === "slow-movers" ? Math.max(0, 18 - product.orders30d) : 0;

  return Math.round(healthRisk + signalWeight + actionWeight + stockWeight + reviewWeight + slowMoverWeight);
}

function getSellerAgentFocusLabel(focus: SellerAgentFocusKey): string {
  const labels: Record<SellerAgentFocusKey, string> = {
    all: "Genel öncelik",
    "at-risk": "Riskli ürünler",
    campaign: "Kampanya",
    content: "Listeleme",
    "customer-voice": "Müşteri sesi",
    growth: "Büyüme",
    inventory: "Stok",
    "negative-reviews": "Negatif yorum",
    operations: "Operasyon",
    profitability: "Kârlılık",
    "return-risk": "İade riski",
    returns: "İade",
    "slow-movers": "Satılmayan ürünler",
    "stock-risk": "Stok riski",
  };

  return labels[focus];
}

function isSellerAgentFocusKey(value: string): value is SellerAgentFocusKey {
  return sellerAgentFocusKeys.includes(value as SellerAgentFocusKey);
}

function getProductsEndpoint(focus: SellerAgentFocusKey): string {
  if (focus === "all" || focus === "content" || focus === "profitability") {
    return "/api/seller/products";
  }

  if (focus === "inventory") {
    return "/api/seller/products?focus=stock-risk";
  }

  return `/api/seller/products?focus=${focus}`;
}

function getProductsHref(focus: SellerAgentFocusKey): string {
  return getProductsEndpoint(focus).replace("/api", "");
}

function formatTryCompact(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    compactDisplay: "short",
    currency: "TRY",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function stringifyListingValue(value: string | number): string {
  return typeof value === "number" ? `${value} TRY` : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
