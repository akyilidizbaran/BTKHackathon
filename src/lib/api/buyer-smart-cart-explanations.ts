import {
  generateLlmJson,
  normalizeLlmString,
  normalizeLlmStringArray,
} from "@/lib/llm";
import type { LlmJsonValidationResult, LlmTextGenerationResult } from "@/lib/llm";
import {
  buyerSmartCartEndpoint,
  defaultBuyerId,
  getBuyerSmartCartApiData,
  type BuyerSmartCartApiData,
  type BuyerSmartCartApiRequest,
} from "@/lib/api/buyer";
import {
  getReviewIntelligenceApiData,
  type ReviewIntelligenceApiData,
} from "@/lib/api/review-intelligence";

export const buyerSmartCartExplanationEndpoint = "/api/buyer/smart-cart/explanation";

export interface BuyerSmartCartExplanationApiContractMeta {
  envelope: "success/data/error";
  source: "llm-explanation";
  generatedAt: string;
  endpoint: typeof buyerSmartCartExplanationEndpoint;
  method: "POST";
  modelCall: "runtime-only";
}

export interface BuyerSmartCartExplanationApiData {
  contract: BuyerSmartCartExplanationApiContractMeta;
  request: BuyerSmartCartApiRequest;
  summary: {
    itemCount: number;
    confidenceScore: number;
    totalPrice: number;
    intentLabel: string;
    budgetStatusLabel: string;
  };
  explanation: BuyerSmartCartModelExplanation;
  source: {
    smartCartEndpoint: typeof buyerSmartCartEndpoint;
    selectedItemCount: number;
    warningCount: number;
    alternativeCount: number;
    complementaryCount: number;
    sellerSignalCount: number;
    reviewIntelligenceProductCount: number;
  };
}

export interface BuyerSmartCartModelExplanation {
  status: "generated" | "fallback";
  provider: LlmTextGenerationResult["provider"];
  model: string;
  generatedAt: string;
  headline: string;
  summary: string;
  evidenceBullets: string[];
  buyerDecision: string;
  riskNote: string;
  sellerSignalBridge: string;
  cartAdjustment: string;
  fallbackReason?: string;
}

export interface BuyerSmartCartExplanationOptions {
  forceFallback?: boolean;
  modelTextOverride?: string;
}

interface ParsedExplanationBody {
  headline: string;
  summary: string;
  evidenceBullets: string[];
  buyerDecision: string;
  riskNote: string;
  sellerSignalBridge: string;
  cartAdjustment: string;
}

export async function getBuyerSmartCartExplanationApiData(
  request: BuyerSmartCartApiRequest,
  options: BuyerSmartCartExplanationOptions = {},
): Promise<BuyerSmartCartExplanationApiData> {
  const smartCart = getBuyerSmartCartApiData({
    ...request,
    buyerId: request.buyerId || defaultBuyerId,
  });
  const reviewIntelligenceItems = await getBuyerReviewIntelligenceForSmartCart(smartCart, options);
  const fallbackBody = createFallbackExplanationBody(smartCart, reviewIntelligenceItems);
  const llmResult = await generateLlmJson({
    fallbackValue: fallbackBody,
    forceFallback: options.forceFallback,
    input: createBuyerSmartCartExplanationInput(smartCart, reviewIntelligenceItems),
    instructions: createBuyerSmartCartExplanationInstructions(),
    metadata: {
      buyer_id: smartCart.request.buyerId ?? defaultBuyerId,
      intent_type: smartCart.summary.intentType,
      task: "buyer_smart_cart_explanation",
    },
    modelTextOverride: options.modelTextOverride,
    validate: (value, fallbackValue) => validateBuyerSmartCartExplanationBody(value, fallbackValue, smartCart),
  });

  return {
    contract: {
      endpoint: buyerSmartCartExplanationEndpoint,
      envelope: "success/data/error",
      generatedAt: llmResult.generatedAt,
      method: "POST",
      modelCall: "runtime-only",
      source: "llm-explanation",
    },
    explanation: {
      ...llmResult.value,
      fallbackReason: llmResult.fallbackReason,
      generatedAt: llmResult.generatedAt,
      model: llmResult.model,
      provider: llmResult.provider,
      status: llmResult.status,
    },
    request: smartCart.request,
    source: {
      alternativeCount: smartCart.result.alternatives.length,
      complementaryCount: smartCart.result.complementarySuggestions.length,
      selectedItemCount: smartCart.result.selectedItems.length,
      sellerSignalCount: smartCart.result.sellerSignalCandidates.length,
      smartCartEndpoint: buyerSmartCartEndpoint,
      warningCount: smartCart.result.warnings.length,
      reviewIntelligenceProductCount: reviewIntelligenceItems.length,
    },
    summary: {
      budgetStatusLabel: smartCart.summary.budgetStatusLabel,
      confidenceScore: smartCart.summary.confidenceScore,
      intentLabel: smartCart.summary.intentLabel,
      itemCount: smartCart.summary.itemCount,
      totalPrice: smartCart.summary.totalPrice,
    },
  };
}

function createBuyerSmartCartExplanationInstructions(): string {
  return [
    "Alışveriş Arkadaşım alıcı smart cart explanation katmanısın.",
    "Sadece verilen JSON context içindeki ürün, uyarı, bütçe, güven ve satıcı sinyali verilerini kullan; veri uydurma.",
    "Çıktıyı Türkçe, kısa, karar güveni odaklı ve alıcının neden bu sepeti görmesi gerektiğini açıklayacak şekilde yaz.",
    "budget.hasRequestedBudget false ise bütçe limiti, bütçeniz X TL, bütçe içinde/altında veya tolerans iddiası yazma; sadece budgetStatusLabel değerini kullan.",
    "Kesinlikle geçerli JSON dön. Markdown, açıklama veya code fence kullanma.",
    'JSON shape: {"headline":"...","summary":"...","evidenceBullets":["..."],"buyerDecision":"...","riskNote":"...","sellerSignalBridge":"...","cartAdjustment":"..."}',
    "evidenceBullets 3-4 madde olsun; her madde verilen selectedItems, warnings, alternatives veya sellerSignals alanına dayanmalı.",
  ].join("\n");
}

function createBuyerSmartCartExplanationInput(
  smartCart: BuyerSmartCartApiData,
  reviewIntelligenceItems: ReviewIntelligenceApiData[],
): string {
  return JSON.stringify(
    {
      budget: {
        budgetGuardrail: smartCart.result.budget
          ? "Kullanıcı bütçe belirtti; yalnızca requestedBudget ve budgetStatusLabel değerlerine dayan."
          : "Kullanıcı bütçe belirtmedi; bütçe limiti, bütçeniz X TL, bütçe içinde veya bütçe altında gibi iddialar yazma.",
        budgetStatusLabel: smartCart.summary.budgetStatusLabel,
        hasRequestedBudget: Boolean(smartCart.result.budget),
        isOverRequestedBudget: smartCart.result.isOverRequestedBudget,
        isOverSoftBudget: smartCart.result.isOverSoftBudget,
        remainingBudget: smartCart.result.remainingBudget ?? null,
        requestedBudget: smartCart.result.budget ?? null,
        softBudgetLimit: smartCart.result.softBudgetLimit ?? null,
        totalPrice: smartCart.summary.totalPrice,
      },
      buyer: {
        buyerId: smartCart.request.buyerId,
        buyerName: smartCart.result.buyerName,
        personalizationNotes: smartCart.result.buyerPersonalizationNotes,
      },
      cart: {
        confidenceScore: smartCart.summary.confidenceScore,
        intentLabel: smartCart.summary.intentLabel,
        itemCount: smartCart.summary.itemCount,
        prompt: smartCart.result.prompt,
      },
      selectedItems: smartCart.result.selectedItems.map((item) => ({
        cartRole: item.cartRole,
        confidenceScore: item.confidenceScore,
        price: item.price,
        productName: item.productName,
        quantity: item.quantity,
        reasons: item.reasons,
        warnings: item.warnings.map((warning) => ({
          message: warning.message,
          severity: warning.severity,
          title: warning.title,
        })),
      })),
      alternatives: smartCart.result.alternatives.slice(0, 3),
      complementarySuggestions: smartCart.result.complementarySuggestions.slice(0, 3),
      sellerSignals: smartCart.result.sellerSignalCandidates.map((signal) => ({
        summary: signal.summary,
        type: signal.type,
      })),
      warnings: smartCart.result.warnings.map((warning) => ({
        message: warning.message,
        severity: warning.severity,
        title: warning.title,
      })),
      reviewIntelligence: reviewIntelligenceItems.map((item) => ({
        buyerFacingWarning: item.intelligence.buyerFacingWarning,
        productId: item.product.id,
        productName: item.product.name,
        repeatedComplaintThemes: item.intelligence.repeatedComplaintThemes,
        riskSummary: item.intelligence.riskSummary,
        reviewClusters: item.intelligence.reviewClusters.map((cluster) => ({
          reviewIds: cluster.reviewIds,
          severity: cluster.severity,
          summary: cluster.summary,
          theme: cluster.theme,
        })),
      })),
    },
    null,
    2,
  );
}

function createFallbackExplanationBody(
  smartCart: BuyerSmartCartApiData,
  reviewIntelligenceItems: ReviewIntelligenceApiData[] = [],
): ParsedExplanationBody {
  const primaryItem = smartCart.result.selectedItems[0];
  const primaryWarning = smartCart.result.warnings[0];
  const primaryAlternative = smartCart.result.alternatives[0] ?? smartCart.result.complementarySuggestions[0];
  const primarySignal = smartCart.result.sellerSignalCandidates[0];
  const primaryReviewIntelligence = reviewIntelligenceItems[0];
  const itemEvidence = smartCart.result.selectedItems
    .slice(0, 3)
    .map((item) => `${item.cartRole}: ${item.productName}, güven ${item.confidenceScore}/100. ${item.reasons[0]}`)
    .filter(Boolean);
  const warningEvidence = primaryWarning ? [`Uyarı: ${primaryWarning.title}. ${primaryWarning.message}`] : [];
  const reviewEvidence = primaryReviewIntelligence
    ? [`Review Intelligence: ${primaryReviewIntelligence.intelligence.riskSummary}`]
    : [];
  const evidenceBullets = [...itemEvidence, ...warningEvidence, ...reviewEvidence].slice(0, 4);

  return {
    buyerDecision: primaryItem
      ? `Önce ${primaryItem.productName} kararını koru; bu ürün sepet rolünü en net taşıyor.`
      : "Komutu biraz daha netleştirerek sepet kararını yeniden üret.",
    cartAdjustment: primaryAlternative
      ? `${primaryAlternative.productName} alternatif veya tamamlayıcı olarak izlenebilir.`
      : "Bu sepet için ek alternatif önerisi gerekmiyor.",
    evidenceBullets,
    headline: `${smartCart.summary.intentLabel} için sepet kararı`,
    riskNote: primaryReviewIntelligence?.intelligence.buyerFacingWarning ??
      primaryWarning?.message ??
      "Bu sepet için kritik satın alma uyarısı yok.",
    sellerSignalBridge: primarySignal?.summary ?? "Bu sepet satıcı tarafına düşük öncelikli talep sinyali olarak döner.",
    summary: `${smartCart.summary.itemCount} ürün ${smartCart.summary.budgetStatusLabel.toLocaleLowerCase("tr-TR")} seçildi; toplam ${smartCart.summary.totalPrice.toLocaleString("tr-TR")} TL ve güven skoru ${smartCart.summary.confidenceScore}/100.`,
  };
}

async function getBuyerReviewIntelligenceForSmartCart(
  smartCart: BuyerSmartCartApiData,
  options: Pick<BuyerSmartCartExplanationOptions, "forceFallback">,
): Promise<ReviewIntelligenceApiData[]> {
  const productIds = getReviewWarningProductIds(smartCart).slice(0, 2);
  const intelligenceItems = await Promise.all(
    productIds.map((productId) =>
      getReviewIntelligenceApiData(
        { productId },
        {
          forceFallback: options.forceFallback,
        },
      )
    ),
  );

  return intelligenceItems.filter((item): item is ReviewIntelligenceApiData => Boolean(item));
}

function getReviewWarningProductIds(smartCart: BuyerSmartCartApiData): string[] {
  const warningProductIds = smartCart.result.warnings
    .filter((warning) => Boolean(warning.productId) && isReviewRelatedWarning(warning.title, warning.message))
    .map((warning) => warning.productId)
    .filter((productId): productId is string => Boolean(productId));
  const itemWarningProductIds = smartCart.result.selectedItems.flatMap((item) =>
    item.warnings
      .filter((warning) => Boolean(warning.productId) && isReviewRelatedWarning(warning.title, warning.message))
      .map((warning) => warning.productId)
      .filter((productId): productId is string => Boolean(productId)),
  );

  return [...warningProductIds, ...itemWarningProductIds].reduce<string[]>((items, productId) => {
    if (!items.includes(productId)) {
      items.push(productId);
    }

    return items;
  }, []);
}

function isReviewRelatedWarning(title: string, message: string): boolean {
  const normalized = `${title} ${message}`.toLocaleLowerCase("tr-TR");

  return [
    "açıklama",
    "beklenti",
    "geçmiş şikayet",
    "iade",
    "listeleme",
    "ses seviyesi",
    "uyumluluk",
    "yorum",
  ].some((keyword) => normalized.includes(keyword));
}

function validateBuyerSmartCartExplanationBody(
  parsed: Record<string, unknown>,
  fallbackBody: ParsedExplanationBody,
  smartCart: BuyerSmartCartApiData,
): LlmJsonValidationResult<ParsedExplanationBody> {
  const body = applyContextGuardrails(
    {
      buyerDecision: normalizeLlmString(parsed.buyerDecision, fallbackBody.buyerDecision),
      cartAdjustment: normalizeLlmString(parsed.cartAdjustment, fallbackBody.cartAdjustment),
      evidenceBullets: normalizeLlmStringArray(parsed.evidenceBullets, fallbackBody.evidenceBullets, 4),
      headline: normalizeLlmString(parsed.headline, fallbackBody.headline),
      riskNote: normalizeLlmString(parsed.riskNote, fallbackBody.riskNote),
      sellerSignalBridge: normalizeLlmString(parsed.sellerSignalBridge, fallbackBody.sellerSignalBridge),
      summary: normalizeLlmString(parsed.summary, fallbackBody.summary),
    },
    fallbackBody,
    smartCart,
  );

  return {
    ok: true,
    value: body,
  };
}

function applyContextGuardrails(
  body: ParsedExplanationBody,
  fallbackBody: ParsedExplanationBody,
  smartCart: BuyerSmartCartApiData,
): ParsedExplanationBody {
  if (smartCart.result.budget) {
    return body;
  }

  return {
    buyerDecision: guardNoBudgetClaim(body.buyerDecision, fallbackBody.buyerDecision),
    cartAdjustment: guardNoBudgetClaim(body.cartAdjustment, fallbackBody.cartAdjustment),
    evidenceBullets: mergeSafeEvidenceBullets(body.evidenceBullets, fallbackBody.evidenceBullets),
    headline: guardNoBudgetClaim(body.headline, fallbackBody.headline),
    riskNote: guardNoBudgetClaim(body.riskNote, fallbackBody.riskNote),
    sellerSignalBridge: guardNoBudgetClaim(body.sellerSignalBridge, fallbackBody.sellerSignalBridge),
    summary: guardNoBudgetClaim(body.summary, fallbackBody.summary),
  };
}

function guardNoBudgetClaim(value: string, fallback: string): string {
  return hasUnsupportedNoBudgetClaim(value) ? fallback : value;
}

function mergeSafeEvidenceBullets(modelBullets: string[], fallbackBullets: string[]): string[] {
  const safeModelBullets = modelBullets.filter((bullet) => !hasUnsupportedNoBudgetClaim(bullet));
  const merged = [...safeModelBullets, ...fallbackBullets].reduce<string[]>((items, bullet) => {
    if (!items.includes(bullet)) {
      items.push(bullet);
    }

    return items;
  }, []);

  return merged.slice(0, 4);
}

function hasUnsupportedNoBudgetClaim(value: string): boolean {
  const normalized = value.toLocaleLowerCase("tr-TR");

  if (!normalized.includes("bütçe")) {
    return false;
  }

  const unsafePhrases = [
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
    "bütçeyi koruyor",
    "bütçenize",
    "bütçenizi",
  ];

  if (unsafePhrases.some((phrase) => normalized.includes(phrase))) {
    return true;
  }

  const mentionsBudgetAmount =
    /bütçe\w*(?:\s+\S+){0,4}\s+(?:₺\s*)?\d[\d.,]*\s*(?:tl)?/i.test(normalized) ||
    /(?:₺\s*)?\d[\d.,]*\s*(?:tl)?(?:\s+\S+){0,4}\s+bütçe\w*/i.test(normalized);

  if (!mentionsBudgetAmount) {
    return false;
  }

  return ![
    "bütçe belirtilmedi",
    "bütçe bilgisi yok",
    "bütçe girilmedi",
    "bütçe limiti yok",
    "bütçe sınırı yok",
  ].some((safePhrase) => normalized.includes(safePhrase));
}
