import {
  generateLlmJson,
  normalizeLlmString,
  normalizeLlmStringArray,
} from "@/lib/llm";
import type { LlmJsonValidationResult, LlmTextGenerationResult } from "@/lib/llm";
import {
  demoSellerId,
  getSellerActionDetailApiData,
  type SellerActionDetailApiData,
} from "@/lib/api/seller";
import {
  getReviewIntelligenceApiData,
  type ReviewIntelligenceApiData,
} from "@/lib/api/review-intelligence";

export function sellerActionExplanationEndpoint(actionId: string): string {
  return `/api/seller/actions/${actionId}/explanation`;
}

export interface SellerActionExplanationApiContractMeta {
  envelope: "success/data/error";
  source: "llm-explanation";
  generatedAt: string;
  sellerId: string;
  endpoint: string;
  method: "GET";
  actionId: string;
  modelCall: "runtime-only";
}

export interface SellerActionExplanationApiData {
  contract: SellerActionExplanationApiContractMeta;
  action: {
    id: string;
    title: string;
    type: string;
    priorityScore: number;
    timeHorizonLabel: string;
  };
  explanation: SellerActionModelExplanation;
  source: {
    actionEndpoint: string;
    affectedProductCount: number;
    evidenceCount: number;
    relatedBuyerSignalCount: number;
    reviewIntelligenceProductId?: string;
    reviewIntelligenceStatus?: LlmTextGenerationResult["status"];
  };
}

export interface SellerActionModelExplanation {
  status: "generated" | "fallback";
  provider: LlmTextGenerationResult["provider"];
  model: string;
  generatedAt: string;
  headline: string;
  summary: string;
  evidenceBullets: string[];
  nextBestAction: string;
  sellerMessageDraft: string;
  fallbackReason?: string;
}

export interface SellerActionExplanationOptions {
  sellerId?: string;
  forceFallback?: boolean;
}

interface ParsedExplanationBody {
  headline: string;
  summary: string;
  evidenceBullets: string[];
  nextBestAction: string;
  sellerMessageDraft: string;
}

export async function getSellerActionExplanationApiData(
  actionId: string,
  options: SellerActionExplanationOptions = {},
): Promise<SellerActionExplanationApiData | undefined> {
  const sellerId = options.sellerId ?? demoSellerId;
  const detail = getSellerActionDetailApiData(actionId, sellerId);

  if (!detail) {
    return undefined;
  }

  const reviewIntelligence = await getActionReviewIntelligence(detail, {
    forceFallback: options.forceFallback,
    sellerId,
  });
  const fallbackBody = createFallbackExplanationBody(detail, reviewIntelligence);
  const llmResult = await generateLlmJson({
    fallbackValue: fallbackBody,
    forceFallback: options.forceFallback,
    input: createSellerActionExplanationInput(detail, reviewIntelligence),
    instructions: createSellerActionExplanationInstructions(),
    metadata: {
      action_id: detail.action.id,
      seller_id: detail.seller.id,
      task: "seller_action_explanation",
    },
    validate: validateSellerActionExplanationBody,
  });

  return {
    contract: {
      actionId: detail.action.id,
      endpoint: sellerActionExplanationEndpoint(detail.action.id),
      envelope: "success/data/error",
      generatedAt: llmResult.generatedAt,
      method: "GET",
      modelCall: "runtime-only",
      sellerId: detail.seller.id,
      source: "llm-explanation",
    },
    action: {
      id: detail.action.id,
      priorityScore: detail.action.priorityScore,
      timeHorizonLabel: detail.action.timeHorizonLabel,
      title: detail.action.title,
      type: detail.action.type,
    },
    explanation: {
      ...llmResult.value,
      fallbackReason: llmResult.fallbackReason,
      generatedAt: llmResult.generatedAt,
      model: llmResult.model,
      provider: llmResult.provider,
      status: llmResult.status,
    },
    source: {
      actionEndpoint: detail.contract.endpoint,
      affectedProductCount: detail.affectedProducts.length,
      evidenceCount: detail.evidenceSnapshot.length,
      relatedBuyerSignalCount: detail.relatedBuyerSignals.length,
      reviewIntelligenceProductId: reviewIntelligence?.product.id,
      reviewIntelligenceStatus: reviewIntelligence?.intelligence.status,
    },
  };
}

function createSellerActionExplanationInstructions(): string {
  return [
    "CommercePilot seller action explanation katmanısın.",
    "Sadece verilen JSON context içindeki kanıtları kullan; veri uydurma, yeni metrik ekleme.",
    "Çıktıyı Türkçe, kısa, satıcı operasyonuna dönük ve yapılacak iş odaklı yaz.",
    "Kesinlikle geçerli JSON dön. Markdown, açıklama veya code fence kullanma.",
    'JSON shape: {"headline":"...","summary":"...","evidenceBullets":["..."],"nextBestAction":"...","sellerMessageDraft":"..."}',
    "evidenceBullets 3-4 madde olsun; her madde verilen evidence veya metric alanına dayanmalı.",
  ].join("\n");
}

function createSellerActionExplanationInput(
  detail: SellerActionDetailApiData,
  reviewIntelligence: ReviewIntelligenceApiData | undefined,
): string {
  return JSON.stringify(
    {
      action: {
        categoryLabel: detail.action.categoryLabel,
        expectedOutcome: detail.action.expectedOutcome,
        impactLabel: detail.action.impactLabel,
        priorityScore: detail.action.priorityScore,
        recommendedNextStep: detail.action.recommendedNextStep,
        summary: detail.action.summary,
        timeHorizonLabel: detail.action.timeHorizonLabel,
        title: detail.action.title,
        type: detail.action.type,
        urgencyLabel: detail.action.urgencyLabel,
      },
      affectedProducts: detail.affectedProducts.slice(0, 4).map((product) => ({
        healthScore: product.healthScore,
        name: product.name,
        orders30d: product.orders30d,
        revenue30d: product.revenue30d,
        stockStatusLabel: product.stockStatusLabel,
      })),
      buyerSignals: detail.relatedBuyerSignals.slice(0, 3).map((signal) => ({
        priorityScore: signal.priorityScore,
        sourcePrompt: signal.sourcePrompt,
        summary: signal.summary,
        typeLabel: signal.typeLabel,
      })),
      drafts: detail.executionPreview.generatedDrafts,
      evidenceSnapshot: detail.evidenceSnapshot,
      executionSteps: detail.executionPreview.steps.map((step) => ({
        detail: step.detail,
        owner: step.owner,
        priorityLabel: step.priorityLabel,
        title: step.title,
      })),
      llmReadyFacts: detail.llmReadyContext.facts,
      reviewIntelligence: reviewIntelligence
        ? {
            buyerFacingWarning: reviewIntelligence.intelligence.buyerFacingWarning,
            clusters: reviewIntelligence.intelligence.reviewClusters,
            listingFixSuggestions: reviewIntelligence.intelligence.listingFixSuggestions,
            repeatedComplaintThemes: reviewIntelligence.intelligence.repeatedComplaintThemes,
            riskSummary: reviewIntelligence.intelligence.riskSummary,
            sellerReplyDrafts: reviewIntelligence.intelligence.sellerReplyDrafts,
          }
        : null,
    },
    null,
    2,
  );
}

function createFallbackExplanationBody(
  detail: SellerActionDetailApiData,
  reviewIntelligence: ReviewIntelligenceApiData | undefined,
): ParsedExplanationBody {
  const primaryProduct = detail.affectedProducts[0]?.name ?? "ilgili ürün";
  const evidenceBullets = detail.evidenceSnapshot
    .slice(0, 4)
    .map((item) => `${item.label}: ${item.value}. ${item.helper}`)
    .filter(Boolean);
  const firstDraft = detail.executionPreview.generatedDrafts[0]?.body;

  if (detail.action.type === "review_attention" && reviewIntelligence) {
    const intelligence = reviewIntelligence.intelligence;
    const clusterBullets = intelligence.reviewClusters
      .slice(0, 3)
      .map((cluster) => `${cluster.theme}: ${cluster.summary}`)
      .filter(Boolean);

    return {
      evidenceBullets: [...clusterBullets, ...evidenceBullets].slice(0, 4),
      headline: `${primaryProduct} yorum itirazları kümelendi`,
      nextBestAction: intelligence.listingFixSuggestions[0] ?? detail.action.recommendedNextStep,
      sellerMessageDraft: intelligence.sellerReplyDrafts[0]?.body ?? firstDraft ?? detail.action.expectedOutcome,
      summary: intelligence.riskSummary,
    };
  }

  return {
    evidenceBullets,
    headline: detail.action.title,
    nextBestAction: detail.action.recommendedNextStep || detail.executionPreview.steps[0]?.detail || detail.action.expectedOutcome,
    sellerMessageDraft:
      firstDraft ??
      `${primaryProduct} için ${detail.executionPreview.primaryOwner} sahibiyle aksiyon planı başlatılmalı.`,
    summary: `${detail.action.summary} ${detail.action.expectedOutcome}`,
  };
}

async function getActionReviewIntelligence(
  detail: SellerActionDetailApiData,
  options: { forceFallback?: boolean; sellerId: string },
): Promise<ReviewIntelligenceApiData | undefined> {
  const primaryProductId = detail.affectedProducts[0]?.id;

  if (detail.action.type !== "review_attention" || !primaryProductId) {
    return undefined;
  }

  return getReviewIntelligenceApiData(
    {
      productId: primaryProductId,
      sellerId: options.sellerId,
    },
    {
      forceFallback: options.forceFallback,
    },
  );
}

function validateSellerActionExplanationBody(
  parsed: Record<string, unknown>,
  fallbackBody: ParsedExplanationBody,
): LlmJsonValidationResult<ParsedExplanationBody> {
  return {
    ok: true,
    value: {
      evidenceBullets: normalizeLlmStringArray(parsed.evidenceBullets, fallbackBody.evidenceBullets, 4),
      headline: normalizeLlmString(parsed.headline, fallbackBody.headline),
      nextBestAction: normalizeLlmString(parsed.nextBestAction, fallbackBody.nextBestAction),
      sellerMessageDraft: normalizeLlmString(parsed.sellerMessageDraft, fallbackBody.sellerMessageDraft),
      summary: normalizeLlmString(parsed.summary, fallbackBody.summary),
    },
  };
}
