import { getProductDetail } from "@/lib/data";
import { generateLlmJson, normalizeLlmString, normalizeLlmStringArray } from "@/lib/llm";
import type { LlmJsonValidationResult, LlmTextGenerationResult } from "@/lib/llm";
import { scoreProduct, type ProductScorecard } from "@/lib/scoring";
import type { Product, Review, ReviewSentiment } from "@/types/commerce";

export const reviewIntelligenceEndpoint = "/api/review-intelligence";

export interface ReviewIntelligenceRequest {
  productId: string;
  sellerId?: string;
}

export interface ReviewIntelligenceApiContractMeta {
  envelope: "success/data/error";
  source: "llm-review-intelligence";
  generatedAt: string;
  endpoint: typeof reviewIntelligenceEndpoint;
  method: "POST";
  modelCall: "runtime-only";
}

export interface ReviewIntelligenceApiData {
  contract: ReviewIntelligenceApiContractMeta;
  request: ReviewIntelligenceRequest;
  product: {
    id: string;
    name: string;
    sellerId: string;
    sellerHref: string;
    buyerHref: string;
    ratingAverage: number;
    reviewCount: number;
    returnRate: number;
    listingQualityScore: number;
  };
  reviewStats: {
    sourceReviewCount: number;
    negativeReviewCount: number;
    attentionReviewCount: number;
    repeatedThemeCount: number;
    reviewConfidenceScore: number;
    returnConfidenceScore: number;
    listingConfidenceScore: number;
  };
  intelligence: ReviewIntelligenceModelResult;
  source: {
    sourceReviewIds: string[];
    allowedThemes: string[];
    scorecardProductId: string;
  };
}

export interface ReviewIntelligenceModelResult extends ReviewIntelligenceModelBody {
  status: LlmTextGenerationResult["status"];
  provider: LlmTextGenerationResult["provider"];
  model: string;
  generatedAt: string;
  fallbackReason?: string;
}

export interface ReviewIntelligenceModelBody {
  reviewClusters: ReviewIntelligenceCluster[];
  repeatedComplaintThemes: string[];
  riskSummary: string;
  listingFixSuggestions: string[];
  sellerReplyDrafts: ReviewIntelligenceSellerReplyDraft[];
  buyerFacingWarning: string;
}

export interface ReviewIntelligenceCluster {
  id: string;
  theme: string;
  sentiment: ReviewSentiment | "mixed";
  severity: "low" | "medium" | "high";
  summary: string;
  reviewIds: string[];
}

export interface ReviewIntelligenceSellerReplyDraft {
  reviewId?: string;
  title: string;
  body: string;
}

export interface ReviewIntelligenceOptions {
  forceFallback?: boolean;
  modelTextOverride?: string;
}

export interface ReviewIntelligenceValidationError {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export interface ReviewIntelligenceValidationSuccess {
  ok: true;
  value: ReviewIntelligenceRequest;
}

export type ReviewIntelligenceValidationResult =
  | ReviewIntelligenceValidationError
  | ReviewIntelligenceValidationSuccess;

interface ReviewIntelligenceBuildContext {
  product: Product;
  scorecard: ProductScorecard;
  sourceReviews: Review[];
  fallbackBody: ReviewIntelligenceModelBody;
  sourceReviewIds: string[];
  allowedThemes: string[];
}

export function validateReviewIntelligenceRequest(rawInput: unknown): ReviewIntelligenceValidationResult {
  if (!isRecord(rawInput)) {
    return {
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      ok: false,
      status: 400,
    };
  }

  const productId = typeof rawInput.productId === "string" ? rawInput.productId.trim() : "";

  if (!productId) {
    return {
      code: "PRODUCT_REQUIRED",
      message: "Review Intelligence için productId gerekli.",
      ok: false,
      status: 400,
    };
  }

  const sellerId = typeof rawInput.sellerId === "string" && rawInput.sellerId.trim()
    ? rawInput.sellerId.trim()
    : undefined;

  return {
    ok: true,
    value: {
      productId,
      sellerId,
    },
  };
}

export async function getReviewIntelligenceApiData(
  request: ReviewIntelligenceRequest,
  options: ReviewIntelligenceOptions = {},
): Promise<ReviewIntelligenceApiData | undefined> {
  const context = createReviewIntelligenceBuildContext(request);

  if (!context) {
    return undefined;
  }

  const llmResult = await generateLlmJson({
    fallbackValue: context.fallbackBody,
    forceFallback: options.forceFallback,
    input: createReviewIntelligenceModelInput(context),
    instructions: createReviewIntelligenceModelInstructions(),
    maxOutputTokens: 900,
    metadata: {
      product_id: context.product.id,
      seller_id: context.product.sellerId,
      task: "review_intelligence_orchestration",
    },
    modelTextOverride: options.modelTextOverride,
    validate: (value, fallbackValue) => validateReviewIntelligenceModelBody(value, fallbackValue, context),
  });

  return {
    contract: {
      endpoint: reviewIntelligenceEndpoint,
      envelope: "success/data/error",
      generatedAt: llmResult.generatedAt,
      method: "POST",
      modelCall: "runtime-only",
      source: "llm-review-intelligence",
    },
    intelligence: {
      ...llmResult.value,
      fallbackReason: llmResult.fallbackReason,
      generatedAt: llmResult.generatedAt,
      model: llmResult.model,
      provider: llmResult.provider,
      status: llmResult.status,
    },
    product: {
      buyerHref: `/buyer/products/${context.product.slug}`,
      id: context.product.id,
      listingQualityScore: context.product.listing.qualityScore,
      name: context.product.name,
      ratingAverage: context.product.metrics.ratingAverage,
      returnRate: context.product.metrics.returnRate,
      reviewCount: context.product.metrics.reviewCount,
      sellerHref: `/seller/products/${context.product.slug}`,
      sellerId: context.product.sellerId,
    },
    request: {
      productId: context.product.id,
      sellerId: request.sellerId,
    },
    reviewStats: {
      attentionReviewCount: context.sourceReviews.filter((review) => review.needsSellerAttention).length,
      listingConfidenceScore: context.scorecard.listing.score,
      negativeReviewCount: context.sourceReviews.filter((review) => review.sentiment === "negative").length,
      repeatedThemeCount: context.scorecard.reviews.evidence.repeatedThemes.length,
      returnConfidenceScore: context.scorecard.returns.score,
      reviewConfidenceScore: context.scorecard.reviews.score,
      sourceReviewCount: context.sourceReviews.length,
    },
    source: {
      allowedThemes: context.allowedThemes,
      scorecardProductId: context.scorecard.productId,
      sourceReviewIds: context.sourceReviewIds,
    },
  };
}

function createReviewIntelligenceBuildContext(
  request: ReviewIntelligenceRequest,
): ReviewIntelligenceBuildContext | undefined {
  const detail = getProductDetail(request.productId);

  if (!detail || (request.sellerId && detail.product.sellerId !== request.sellerId)) {
    return undefined;
  }

  const scorecard = scoreProduct(detail);
  const sourceReviews = selectSourceReviews(detail.reviews);
  const sourceReviewIds = sourceReviews.map((review) => review.id);
  const allowedThemes = Array.from(new Set(sourceReviews.flatMap((review) => review.themes)));

  return {
    allowedThemes,
    fallbackBody: createFallbackReviewIntelligenceBody(detail.product, scorecard, sourceReviews, allowedThemes),
    product: detail.product,
    scorecard,
    sourceReviewIds,
    sourceReviews,
  };
}

function createReviewIntelligenceModelInstructions(): string {
  return [
    "CommercePilot Review Intelligence orchestration katmanısın.",
    "Sadece verilen sourceReviews, allowedThemes, product ve scorecard context'ini kullan; yeni yorum, yeni reviewId, yeni ürün veya yeni metrik uydurma.",
    "reviewClusters içindeki reviewIds sadece sourceReviews içinde verilen id'lerden seçilmeli.",
    "repeatedComplaintThemes sadece allowedThemes içindeki değerlerden oluşmalı.",
    "sellerReplyDrafts müşteriyle kavga etmeyen, kısa, destek ekibine uygun Türkçe yanıt taslakları olmalı.",
    "buyerFacingWarning alıcıya gösterilecek kısa risk notudur; abartılı veya olmayan kusur iddiası yazma.",
    "Kesinlikle geçerli JSON dön. Markdown, açıklama veya code fence kullanma.",
    'JSON shape: {"reviewClusters":[{"id":"...","theme":"...","sentiment":"negative|neutral|positive|mixed","severity":"low|medium|high","summary":"...","reviewIds":["..."]}],"repeatedComplaintThemes":["..."],"riskSummary":"...","listingFixSuggestions":["..."],"sellerReplyDrafts":[{"reviewId":"...","title":"...","body":"..."}],"buyerFacingWarning":"..."}',
  ].join("\n");
}

function createReviewIntelligenceModelInput(context: ReviewIntelligenceBuildContext): string {
  return JSON.stringify(
    {
      allowedThemes: context.allowedThemes,
      product: {
        id: context.product.id,
        listingIssueTags: context.product.listing.issueTags,
        listingQualityScore: context.product.listing.qualityScore,
        name: context.product.name,
        ratingAverage: context.product.metrics.ratingAverage,
        returnRate: context.product.metrics.returnRate,
        reviewCount: context.product.metrics.reviewCount,
      },
      scorecard: {
        listing: {
          drivers: context.scorecard.listing.drivers,
          evidence: context.scorecard.listing.evidence,
          score: context.scorecard.listing.score,
          summary: context.scorecard.listing.summary,
        },
        returns: {
          drivers: context.scorecard.returns.drivers,
          evidence: context.scorecard.returns.evidence,
          score: context.scorecard.returns.score,
          summary: context.scorecard.returns.summary,
        },
        reviews: {
          drivers: context.scorecard.reviews.drivers,
          evidence: context.scorecard.reviews.evidence,
          score: context.scorecard.reviews.score,
          summary: context.scorecard.reviews.summary,
        },
      },
      sourceReviews: context.sourceReviews.map((review) => ({
        body: review.body,
        createdAt: review.createdAt,
        id: review.id,
        needsSellerAttention: review.needsSellerAttention,
        rating: review.rating,
        sentiment: review.sentiment,
        themes: review.themes,
        title: review.title,
        verifiedPurchase: review.verifiedPurchase,
      })),
    },
    null,
    2,
  );
}

function createFallbackReviewIntelligenceBody(
  product: Product,
  scorecard: ProductScorecard,
  sourceReviews: Review[],
  allowedThemes: string[],
): ReviewIntelligenceModelBody {
  const clusters = createFallbackReviewClusters(sourceReviews, allowedThemes);
  const repeatedComplaintThemes = clusters.map((cluster) => cluster.theme).slice(0, 4);
  const primaryTheme = repeatedComplaintThemes[0] ?? allowedThemes[0] ?? "yorum";
  const primaryReview = sourceReviews[0];
  const listingFixSuggestions = createFallbackListingFixSuggestions(product, primaryTheme);

  return {
    buyerFacingWarning: `${product.name} yorumlarında ${primaryTheme} teması görünüyor; satın almadan önce ürün açıklamasındaki beklenti notlarını kontrol et.`,
    listingFixSuggestions,
    repeatedComplaintThemes,
    reviewClusters: clusters,
    riskSummary: `${product.name} için yorum güveni ${scorecard.reviews.score}/100; ${sourceReviews.length} kaynak yorum içinde ${sourceReviews.filter((review) => review.needsSellerAttention).length} yorum satıcı aksiyonu gerektiriyor.`,
    sellerReplyDrafts: [
      {
        body: primaryReview
          ? `Geri bildiriminiz için teşekkürler. ${primaryTheme} konusundaki deneyimi ürün açıklaması ve destek akışında netleştiriyoruz.`
          : `Geri bildiriminiz için teşekkürler. ${product.name} için ürün beklentisini daha açık hale getireceğiz.`,
        reviewId: primaryReview?.id,
        title: "Kısa destek yanıtı",
      },
      {
        body: `${product.name} ürün sayfasına ${primaryTheme} beklentisini açıklaştıran kısa bir not eklenmeli.`,
        title: "İç ekip notu",
      },
    ],
  };
}

function validateReviewIntelligenceModelBody(
  parsed: Record<string, unknown>,
  fallbackBody: ReviewIntelligenceModelBody,
  context: ReviewIntelligenceBuildContext,
): LlmJsonValidationResult<ReviewIntelligenceModelBody> {
  const validReviewIds = new Set(context.sourceReviewIds);
  const validThemes = new Set(context.allowedThemes);
  const reviewClusters = normalizeReviewClusters(parsed.reviewClusters, fallbackBody.reviewClusters, validReviewIds, validThemes);
  const repeatedComplaintThemes = normalizeRepeatedComplaintThemes(
    parsed.repeatedComplaintThemes,
    fallbackBody.repeatedComplaintThemes,
    validThemes,
  );

  return {
    ok: true,
    value: {
      buyerFacingWarning: normalizeLimitedString(parsed.buyerFacingWarning, fallbackBody.buyerFacingWarning, 240),
      listingFixSuggestions: normalizeLimitedStringArray(parsed.listingFixSuggestions, fallbackBody.listingFixSuggestions, 4, 220),
      repeatedComplaintThemes,
      reviewClusters,
      riskSummary: normalizeLimitedString(parsed.riskSummary, fallbackBody.riskSummary, 360),
      sellerReplyDrafts: normalizeSellerReplyDrafts(parsed.sellerReplyDrafts, fallbackBody.sellerReplyDrafts, validReviewIds),
    },
  };
}

function selectSourceReviews(reviews: Review[]): Review[] {
  const attentionReviews = reviews.filter((review) =>
    review.needsSellerAttention || review.sentiment === "negative" || review.rating <= 3
  );

  return (attentionReviews.length > 0 ? attentionReviews : reviews).slice(0, 8);
}

function createFallbackReviewClusters(reviews: Review[], allowedThemes: string[]): ReviewIntelligenceCluster[] {
  const themes = allowedThemes.length > 0 ? allowedThemes : ["yorum"];

  return themes.slice(0, 4).map((theme, index) => {
    const matchingReviews = reviews.filter((review) => review.themes.includes(theme as never));
    const sourceReviews = matchingReviews.length > 0 ? matchingReviews : reviews.slice(index, index + 1);
    const severity = sourceReviews.some((review) => review.sentiment === "negative" || review.rating <= 2)
      ? "high"
      : sourceReviews.some((review) => review.needsSellerAttention || review.rating <= 3)
        ? "medium"
        : "low";

    return {
      id: `cluster-${theme}`,
      reviewIds: sourceReviews.map((review) => review.id),
      sentiment: getClusterSentiment(sourceReviews),
      severity,
      summary: `${theme} teması ${sourceReviews.length} kaynak yorumda alıcı beklentisini etkiliyor.`,
      theme,
    };
  });
}

function createFallbackListingFixSuggestions(product: Product, primaryTheme: string): string[] {
  const issueTagSuggestion = product.listing.issueTags[0]
    ? `${product.listing.issueTags[0]} bilgisini ürün açıklamasında netleştir.`
    : `${primaryTheme} beklentisini ürün açıklamasında netleştir.`;

  return [
    issueTagSuggestion,
    "Sık sorulan soru alanına satın alma öncesi kontrol edilmesi gereken koşulları ekle.",
    "Destek ekibine aynı tema için kısa ve tutarlı yanıt şablonu ver.",
  ];
}

function normalizeReviewClusters(
  value: unknown,
  fallbackClusters: ReviewIntelligenceCluster[],
  validReviewIds: Set<string>,
  validThemes: Set<string>,
): ReviewIntelligenceCluster[] {
  if (!Array.isArray(value)) {
    return fallbackClusters;
  }

  const clusters = value
    .map((item, index) => normalizeReviewCluster(item, fallbackClusters[index], validReviewIds, validThemes))
    .filter((cluster): cluster is ReviewIntelligenceCluster => Boolean(cluster))
    .slice(0, 4);

  return clusters.length > 0 ? clusters : fallbackClusters;
}

function normalizeReviewCluster(
  value: unknown,
  fallback: ReviewIntelligenceCluster | undefined,
  validReviewIds: Set<string>,
  validThemes: Set<string>,
): ReviewIntelligenceCluster | undefined {
  if (!isRecord(value)) {
    return fallback;
  }

  const fallbackTheme = fallback?.theme ?? Array.from(validThemes)[0];
  const theme = typeof value.theme === "string" && validThemes.has(value.theme) ? value.theme : fallbackTheme;
  const reviewIds = normalizeReviewIds(value.reviewIds, fallback?.reviewIds ?? [], validReviewIds);

  if (!theme || reviewIds.length === 0) {
    return fallback;
  }

  return {
    id: normalizeId(value.id, fallback?.id ?? `cluster-${theme}`),
    reviewIds,
    sentiment: normalizeClusterSentiment(value.sentiment, fallback?.sentiment ?? "mixed"),
    severity: normalizeClusterSeverity(value.severity, fallback?.severity ?? "medium"),
    summary: normalizeLimitedString(value.summary, fallback?.summary ?? `${theme} teması yorumlarda tekrar ediyor.`, 240),
    theme,
  };
}

function normalizeRepeatedComplaintThemes(
  value: unknown,
  fallbackThemes: string[],
  validThemes: Set<string>,
): string[] {
  if (!Array.isArray(value)) {
    return fallbackThemes;
  }

  const themes = value.reduce<string[]>((items, item) => {
    if (typeof item === "string" && validThemes.has(item) && !items.includes(item)) {
      items.push(item);
    }

    return items;
  }, []);

  return themes.length > 0 ? themes.slice(0, 4) : fallbackThemes;
}

function normalizeSellerReplyDrafts(
  value: unknown,
  fallbackDrafts: ReviewIntelligenceSellerReplyDraft[],
  validReviewIds: Set<string>,
): ReviewIntelligenceSellerReplyDraft[] {
  if (!Array.isArray(value)) {
    return fallbackDrafts;
  }

  const drafts = value
    .map((item, index) => normalizeSellerReplyDraft(item, fallbackDrafts[index], validReviewIds))
    .filter((draft): draft is ReviewIntelligenceSellerReplyDraft => Boolean(draft))
    .slice(0, 3);

  return drafts.length > 0 ? drafts : fallbackDrafts;
}

function normalizeSellerReplyDraft(
  value: unknown,
  fallback: ReviewIntelligenceSellerReplyDraft | undefined,
  validReviewIds: Set<string>,
): ReviewIntelligenceSellerReplyDraft | undefined {
  if (!isRecord(value)) {
    return fallback;
  }

  const reviewId = typeof value.reviewId === "string" && validReviewIds.has(value.reviewId)
    ? value.reviewId
    : fallback?.reviewId;

  return {
    body: normalizeLimitedString(value.body, fallback?.body ?? "Geri bildiriminiz için teşekkürler; konuyu ekip içinde takip ediyoruz.", 360),
    reviewId,
    title: normalizeLimitedString(value.title, fallback?.title ?? "Destek yanıtı", 120),
  };
}

function normalizeReviewIds(value: unknown, fallbackIds: string[], validReviewIds: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return fallbackIds;
  }

  const reviewIds = value.reduce<string[]>((items, item) => {
    if (typeof item === "string" && validReviewIds.has(item) && !items.includes(item)) {
      items.push(item);
    }

    return items;
  }, []);

  return reviewIds.length > 0 ? reviewIds : fallbackIds;
}

function normalizeLimitedStringArray(value: unknown, fallback: string[], limit: number, maxLength: number): string[] {
  const normalized = normalizeLlmStringArray(value, fallback, limit)
    .map((item, index) => (item.length <= maxLength ? item : fallback[index]))
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeLimitedString(value: unknown, fallback: string, maxLength: number): string {
  const normalized = normalizeLlmString(value, fallback);

  return normalized.length <= maxLength ? normalized : fallback;
}

function normalizeId(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value.trim().replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80) || fallback;
}

function normalizeClusterSentiment(value: unknown, fallback: ReviewIntelligenceCluster["sentiment"]): ReviewIntelligenceCluster["sentiment"] {
  return value === "positive" || value === "neutral" || value === "negative" || value === "mixed" ? value : fallback;
}

function normalizeClusterSeverity(value: unknown, fallback: ReviewIntelligenceCluster["severity"]): ReviewIntelligenceCluster["severity"] {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

function getClusterSentiment(reviews: Review[]): ReviewIntelligenceCluster["sentiment"] {
  const sentiments = new Set(reviews.map((review) => review.sentiment));

  return sentiments.size === 1 ? reviews[0]?.sentiment ?? "mixed" : "mixed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
