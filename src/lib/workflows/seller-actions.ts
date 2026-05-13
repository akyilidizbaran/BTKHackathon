import { getProductDetail, getRelatedProducts, getSellerOverview } from "@/lib/data";
import type { ProductScorecard } from "@/lib/scoring";
import { scoreProduct } from "@/lib/scoring";
import type { Product } from "@/types/commerce";
import {
  clampPriority,
  createActionId,
  demandImpact,
  formatPercent,
  formatTry,
  revenueImpact,
  visibilityImpact,
} from "./common";
import type { SellerActionType, SellerActionsWorkflowResult, SellerGrowthAction } from "./types";

interface ProductActionContext {
  product: Product;
  scorecard: ProductScorecard;
}

const defaultActionLimit = 5;

export function generateSellerActionsWorkflow(
  sellerId: string,
  options: { limit?: number } = {},
): SellerActionsWorkflowResult | undefined {
  const overview = getSellerOverview(sellerId);

  if (!overview) {
    return undefined;
  }

  const productContexts = overview.products.flatMap((product) => {
    const detail = getProductDetail(product.id);

    if (!detail) {
      return [];
    }

    return [{ product, scorecard: scoreProduct(detail) }];
  });
  const candidates = productContexts.flatMap((context) => createActionCandidates(context));
  const actions = selectTopActions(candidates, options.limit ?? defaultActionLimit);

  return {
    sellerId: overview.seller.id,
    sellerName: overview.seller.displayName,
    generatedAt: "2026-05-13",
    actions,
    analyzedProductCount: productContexts.length,
  };
}

function createActionCandidates(context: ProductActionContext): SellerGrowthAction[] {
  return [
    createRestockAction(context),
    createPausePromotionAction(context),
    createFixListingAction(context),
    createReviewAttentionAction(context),
    createReturnRiskAction(context),
    createBundleAction(context),
    createPromoteWinnerAction(context),
    createProtectMarginAction(context),
  ].filter((action): action is SellerGrowthAction => Boolean(action));
}

function createRestockAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;
  const evidence = scorecard.inventory.evidence;
  const isLowCoverage =
    scorecard.inventory.score < 70 ||
    evidence.projectedGap7d > 0 ||
    evidence.availableStock <= evidence.reorderPoint;

  if (!isLowCoverage) {
    return undefined;
  }

  const priorityScore = clampPriority(
    55 + (100 - scorecard.inventory.score) * 0.35 + demandImpact(product) + revenueImpact(product),
  );

  return createAction({
    type: "restock",
    product,
    scorecard,
    priorityScore,
    title: `${product.name} için stok yenile`,
    summary: scorecard.inventory.summary,
    reasoning: [
      ...scorecard.inventory.drivers,
      `Ürün son 30 günde ${product.metrics.orders30d} sipariş aldı.`,
      `Mevcut ürün sağlığı skoru: ${scorecard.health.score}/100`,
    ],
    evidence: {
      inventory: evidence,
      revenue30d: product.metrics.revenue30d,
      healthScore: scorecard.health.score,
    },
    recommendedNextStep:
      evidence.projectedGap7d > 0
        ? `En az ${evidence.projectedGap7d} adet ek stok planla ve stok yenilenene kadar agresif kampanya açma.`
        : "Stok yeniden sipariş eşiğine yaklaştığı için tedarik planını öne çek.",
  });
}

function createPausePromotionAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;
  const hasPromotionRisk =
    (scorecard.inventory.score < 55 || scorecard.shipping.score < 55) &&
    (product.metrics.adSpend30d > 1500 || product.metrics.views30d > 1500);

  if (!hasPromotionRisk) {
    return undefined;
  }

  const priorityScore = clampPriority(
    44 +
      (100 - scorecard.inventory.score) * 0.22 +
      (100 - scorecard.shipping.score) * 0.24 +
      visibilityImpact(product),
  );

  return createAction({
    type: "pause_promotion",
    product,
    scorecard,
    priorityScore,
    title: `${product.name} için kampanya temposunu kontrol et`,
    summary:
      "Ürün görünürlük veya reklam desteği alıyor ancak stok/kargo sinyalleri büyütme için yeterince güvenli değil.",
    reasoning: [
      `Stok kapsaması: ${scorecard.inventory.score}/100`,
      `Kargo güveni: ${scorecard.shipping.score}/100`,
      `Son 30 gün reklam harcaması: ${formatTry(product.metrics.adSpend30d)}`,
      ...scorecard.shipping.drivers.slice(0, 3),
    ],
    evidence: {
      inventory: scorecard.inventory.evidence,
      shipping: scorecard.shipping.evidence,
      adSpend30d: product.metrics.adSpend30d,
      views30d: product.metrics.views30d,
    },
    recommendedNextStep:
      "Stok ve teslimat güveni iyileşmeden bu üründe reklam bütçesini büyütme; önce operasyonel riski azalt.",
  });
}

function createFixListingAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;

  if (scorecard.listing.score >= 70) {
    return undefined;
  }

  const priorityScore = clampPriority(
    48 + (100 - scorecard.listing.score) * 0.32 + visibilityImpact(product) + revenueImpact(product),
  );

  return createAction({
    type: "fix_listing",
    product,
    scorecard,
    priorityScore,
    title: `${product.name} listelemesini iyileştir`,
    summary: scorecard.listing.summary,
    reasoning: [
      ...scorecard.listing.drivers,
      `Ürün son 30 günde ${product.metrics.views30d} görüntülenme aldı.`,
      `Dönüşüm oranı: ${formatPercent(product.metrics.conversionRate)}`,
    ],
    evidence: {
      listing: scorecard.listing.evidence,
      views30d: product.metrics.views30d,
      conversionRate: product.metrics.conversionRate,
      returnScore: scorecard.returns.score,
    },
    recommendedNextStep:
      "Başlık, açıklama, teknik özellik ve görselleri alıcı beklentisini netleştirecek şekilde güncelle.",
  });
}

function createReviewAttentionAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;
  const attentionCount = scorecard.reviews.evidence.attentionReviewCount;

  if (scorecard.reviews.score >= 72 && attentionCount === 0) {
    return undefined;
  }

  const priorityScore = clampPriority(
    50 +
      (100 - scorecard.reviews.score) * 0.34 +
      attentionCount * 5 +
      visibilityImpact(product),
  );

  return createAction({
    type: "review_attention",
    product,
    scorecard,
    priorityScore,
    title: `${product.name} yorumlarını acil incele`,
    summary: scorecard.reviews.summary,
    reasoning: [
      ...scorecard.reviews.drivers,
      `Ürün iade güveni: ${scorecard.returns.score}/100`,
      `Ürün listeleme güveni: ${scorecard.listing.score}/100`,
    ],
    evidence: {
      reviews: scorecard.reviews.evidence,
      returnScore: scorecard.returns.score,
      listingScore: scorecard.listing.score,
    },
    recommendedNextStep:
      "Tekrar eden şikayetleri ürün açıklaması, kalite kontrol veya müşteri cevap taslaklarıyla aksiyona çevir.",
  });
}

function createReturnRiskAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;

  if (scorecard.returns.score >= 72) {
    return undefined;
  }

  const priorityScore = clampPriority(
    48 +
      (100 - scorecard.returns.score) * 0.36 +
      product.metrics.returnRate * 90 +
      revenueImpact(product),
  );

  return createAction({
    type: "reduce_return_risk",
    product,
    scorecard,
    priorityScore,
    title: `${product.name} için iade riskini azalt`,
    summary: scorecard.returns.summary,
    reasoning: [
      ...scorecard.returns.drivers,
      `Listeleme güveni: ${scorecard.listing.score}/100`,
      `Yorum güveni: ${scorecard.reviews.score}/100`,
    ],
    evidence: {
      returns: scorecard.returns.evidence,
      listingScore: scorecard.listing.score,
      reviewScore: scorecard.reviews.score,
    },
    recommendedNextStep:
      "Uyumluluk, ölçü, paketleme veya kalite beklentisini ürün sayfasında açıklaştır; iade sebebini tetikleyen temayı azalt.",
  });
}

function createBundleAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;
  const relatedProducts = getRelatedProducts(product.id).filter((relatedProduct) => {
    return product.demoStoryFlags.includes("bundle_candidate") || relatedProduct.demoStoryFlags.includes("bundle_candidate");
  });
  const bundleCandidates = relatedProducts.slice(0, 3);

  if (bundleCandidates.length === 0 || scorecard.promotionReadiness.score < 60) {
    return undefined;
  }

  const priorityScore = clampPriority(
    44 +
      scorecard.promotionReadiness.score * 0.24 +
      scorecard.health.score * 0.15 +
      demandImpact(product),
  );
  const bundleNames = bundleCandidates.map((bundleProduct) => bundleProduct.name);

  return createAction({
    type: "create_bundle",
    product,
    scorecard,
    priorityScore,
    productIds: [product.id, ...bundleCandidates.map((bundleProduct) => bundleProduct.id)],
    title: `${product.name} ile bundle fırsatı oluştur`,
    summary: `${product.name}, ${bundleNames.join(", ")} ile birlikte anlamlı bir paket senaryosu taşıyor.`,
    reasoning: [
      `Kampanya hazırlığı: ${scorecard.promotionReadiness.score}/100`,
      `Ürün sağlığı: ${scorecard.health.score}/100`,
      `İlişkili ürünler: ${bundleNames.join(", ")}`,
      ...scorecard.promotionReadiness.drivers.slice(0, 2),
    ],
    evidence: {
      promotionReadiness: scorecard.promotionReadiness.evidence,
      relatedProducts: bundleCandidates.map((bundleProduct) => ({
        id: bundleProduct.id,
        name: bundleProduct.name,
        price: bundleProduct.price,
      })),
    },
    recommendedNextStep:
      "Bu ürünleri tek sepet senaryosu olarak paketle; ürün açıklamasında birlikte kullanım değerini açık yaz.",
  });
}

function createPromoteWinnerAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;
  const isWinner =
    scorecard.health.score >= 75 &&
    scorecard.promotionReadiness.score >= 75 &&
    scorecard.inventory.score >= 70;

  if (!isWinner) {
    return undefined;
  }

  const priorityScore = clampPriority(
    40 +
      scorecard.health.score * 0.24 +
      scorecard.promotionReadiness.score * 0.18 +
      demandImpact(product),
  );

  return createAction({
    type: "promote_winner",
    product,
    scorecard,
    priorityScore,
    title: `${product.name} ürününü öne çıkar`,
    summary: scorecard.health.summary,
    reasoning: [
      `Ürün sağlığı: ${scorecard.health.score}/100`,
      `Kampanya hazırlığı: ${scorecard.promotionReadiness.score}/100`,
      `Yorum güveni: ${scorecard.reviews.score}/100`,
      `Kargo güveni: ${scorecard.shipping.score}/100`,
    ],
    evidence: {
      health: scorecard.health.evidence,
      promotionReadiness: scorecard.promotionReadiness.evidence,
      orders30d: product.metrics.orders30d,
      revenue30d: product.metrics.revenue30d,
    },
    recommendedNextStep:
      "Ürünü vitrin, bundle veya düşük bütçeli kampanya ile büyüt; stok kapsamasını izlemeye devam et.",
  });
}

function createProtectMarginAction(context: ProductActionContext): SellerGrowthAction | undefined {
  const { product, scorecard } = context;

  if (scorecard.profitability.score >= 65) {
    return undefined;
  }

  const priorityScore = clampPriority(
    46 +
      (100 - scorecard.profitability.score) * 0.36 +
      revenueImpact(product) +
      product.metrics.adSpend30d / 900,
  );

  return createAction({
    type: "protect_margin",
    product,
    scorecard,
    priorityScore,
    title: `${product.name} için kârlılığı koru`,
    summary: scorecard.profitability.summary,
    reasoning: [
      ...scorecard.profitability.drivers,
      `Kampanya hazırlığı: ${scorecard.promotionReadiness.score}/100`,
      `İade güveni: ${scorecard.returns.score}/100`,
    ],
    evidence: {
      profitability: scorecard.profitability.evidence,
      promotionReadinessScore: scorecard.promotionReadiness.score,
      returnScore: scorecard.returns.score,
    },
    recommendedNextStep:
      "Reklam bütçesi, fiyat ve iade azaltma adımlarını birlikte değerlendir; marj düzelmeden büyütme aksiyonu verme.",
  });
}

interface CreateActionInput {
  type: SellerActionType;
  product: Product;
  scorecard: ProductScorecard;
  priorityScore: number;
  title: string;
  summary: string;
  reasoning: string[];
  evidence: Record<string, unknown>;
  recommendedNextStep: string;
  productIds?: string[];
}

function createAction(input: CreateActionInput): SellerGrowthAction {
  const productIds = input.productIds ?? [input.product.id];

  return {
    id: createActionId(input.type, input.product.id),
    type: input.type,
    title: input.title,
    summary: input.summary,
    priorityScore: input.priorityScore,
    productIds,
    reasoning: input.reasoning,
    evidence: input.evidence,
    recommendedNextStep: input.recommendedNextStep,
    llmReadyContext: {
      task: "seller_growth_action_explanation",
      locale: "tr-TR",
      audience: "seller",
      facts: {
        actionType: input.type,
        title: input.title,
        summary: input.summary,
        priorityScore: input.priorityScore,
        productIds,
        reasoning: input.reasoning,
        evidence: input.evidence,
        recommendedNextStep: input.recommendedNextStep,
      },
      instruction:
        "Bu structured aksiyonu satıcıya kısa, güvenilir ve yapılacak iş odaklı Türkçe ile açıkla. Kanıtsız iddia ekleme.",
    },
  };
}

function selectTopActions(actions: SellerGrowthAction[], limit: number): SellerGrowthAction[] {
  const sortedActions = [...actions].sort(
    (first, second) => second.priorityScore - first.priorityScore,
  );
  const selected: SellerGrowthAction[] = [];
  const selectedTypes = new Set<SellerActionType>();
  const selectedProductIds = new Set<string>();

  for (const action of sortedActions) {
    if (selected.length >= limit) {
      break;
    }

    const hasSelectedProduct = action.productIds.some((productId) => selectedProductIds.has(productId));

    if (selectedTypes.has(action.type) || hasSelectedProduct) {
      continue;
    }

    selected.push(action);
    selectedTypes.add(action.type);
    action.productIds.forEach((productId) => selectedProductIds.add(productId));
  }

  for (const action of sortedActions) {
    if (selected.length >= limit) {
      break;
    }

    if (selected.some((selectedAction) => selectedAction.id === action.id)) {
      continue;
    }

    selected.push(action);
  }

  return selected.sort((first, second) => second.priorityScore - first.priorityScore);
}
