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
import type {
  SellerActionCategory,
  SellerActionChecklistItem,
  SellerActionEffortLevel,
  SellerActionImpactLevel,
  SellerActionMetricHighlight,
  SellerActionTimeHorizon,
  SellerActionType,
  SellerActionUrgency,
  SellerActionsWorkflowResult,
  SellerGrowthAction,
} from "./types";

interface ProductActionContext {
  product: Product;
  scorecard: ProductScorecard;
}

const defaultActionLimit = 5;

const categoryLabels: Record<SellerActionCategory, string> = {
  inventory: "Stok ve tedarik",
  operations: "Operasyon riski",
  content: "Listeleme kalitesi",
  customer_voice: "Müşteri sesi",
  returns: "İade riski",
  campaign: "Kampanya ve bundle",
  growth: "Büyüme fırsatı",
  profitability: "Kârlılık",
};

const urgencyLabels: Record<SellerActionUrgency, string> = {
  critical: "Kritik",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};

const impactLabels: Record<SellerActionImpactLevel, string> = {
  high: "Yüksek etki",
  medium: "Orta etki",
  low: "Düşük etki",
};

const effortLabels: Record<SellerActionEffortLevel, string> = {
  low: "Düşük efor",
  medium: "Orta efor",
  high: "Yüksek efor",
};

const timeHorizonLabels: Record<SellerActionTimeHorizon, string> = {
  today: "Bugün",
  this_week: "Bu hafta",
  monitor: "İzlemede tut",
};

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
  const category = getActionCategory(input.type);
  const urgency = getActionUrgency(input.type, input.priorityScore, input.scorecard);
  const impactLevel = getActionImpactLevel(input.priorityScore, input.product);
  const effortLevel = getActionEffortLevel(input.type);
  const timeHorizon = getActionTimeHorizon(input.type, urgency);
  const expectedOutcome = createExpectedOutcome(input.type, input.product);
  const metricHighlights = createMetricHighlights(input.type, input.product, input.scorecard, input.evidence);
  const todayChecklist = createTodayChecklist(input.type, input.product, input.scorecard);

  return {
    id: createActionId(input.type, input.product.id),
    type: input.type,
    title: input.title,
    summary: input.summary,
    priorityScore: input.priorityScore,
    category,
    categoryLabel: categoryLabels[category],
    urgency,
    urgencyLabel: urgencyLabels[urgency],
    impactLevel,
    impactLabel: impactLabels[impactLevel],
    effortLevel,
    effortLabel: effortLabels[effortLevel],
    timeHorizon,
    timeHorizonLabel: timeHorizonLabels[timeHorizon],
    expectedOutcome,
    metricHighlights,
    todayChecklist,
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
        category,
        urgency,
        impactLevel,
        effortLevel,
        timeHorizon,
        expectedOutcome,
        metricHighlights,
        todayChecklist,
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

function getActionCategory(type: SellerActionType): SellerActionCategory {
  switch (type) {
    case "restock":
      return "inventory";
    case "pause_promotion":
      return "operations";
    case "fix_listing":
      return "content";
    case "review_attention":
      return "customer_voice";
    case "reduce_return_risk":
      return "returns";
    case "create_bundle":
      return "campaign";
    case "promote_winner":
      return "growth";
    case "protect_margin":
      return "profitability";
  }
}

function getActionUrgency(
  type: SellerActionType,
  priorityScore: number,
  scorecard: ProductScorecard,
): SellerActionUrgency {
  if (
    type === "restock" &&
    (scorecard.inventory.evidence.projectedGap7d > 0 || scorecard.inventory.evidence.coverageDays === 0)
  ) {
    return "critical";
  }

  if (
    type === "pause_promotion" &&
    (scorecard.inventory.score < 45 || scorecard.shipping.score < 45)
  ) {
    return "critical";
  }

  if (type === "create_bundle" || type === "promote_winner") {
    if (priorityScore >= 78) {
      return "high";
    }

    if (priorityScore >= 60) {
      return "medium";
    }

    return "low";
  }

  if (priorityScore >= 85) {
    return "critical";
  }

  if (priorityScore >= 74) {
    return "high";
  }

  if (priorityScore >= 60) {
    return "medium";
  }

  return "low";
}

function getActionImpactLevel(priorityScore: number, product: Product): SellerActionImpactLevel {
  if (priorityScore >= 80 || product.metrics.revenue30d >= 60_000 || product.metrics.orders30d >= 85) {
    return "high";
  }

  if (priorityScore >= 62 || product.metrics.revenue30d >= 20_000 || product.metrics.orders30d >= 35) {
    return "medium";
  }

  return "low";
}

function getActionEffortLevel(type: SellerActionType): SellerActionEffortLevel {
  switch (type) {
    case "pause_promotion":
    case "promote_winner":
      return "low";
    case "restock":
    case "fix_listing":
    case "review_attention":
    case "reduce_return_risk":
    case "create_bundle":
    case "protect_margin":
      return "medium";
  }
}

function getActionTimeHorizon(
  type: SellerActionType,
  urgency: SellerActionUrgency,
): SellerActionTimeHorizon {
  if (urgency === "critical" || type === "pause_promotion" || type === "protect_margin") {
    return "today";
  }

  if (urgency === "low") {
    return "monitor";
  }

  return "this_week";
}

function createExpectedOutcome(
  type: SellerActionType,
  product: Product,
): string {
  switch (type) {
    case "restock":
      return `${product.name} için stok açığı büyümeden tedarik planı netleşir ve satış kaybı riski düşer.`;
    case "pause_promotion":
      return `${product.name} büyütülmeden önce stok/kargo riski kontrol altına alınır ve reklam bütçesi boşa akmaz.`;
    case "fix_listing":
      return `${product.name} sayfası alıcının karar sorularını daha net cevaplar; dönüşüm ve iade güveni iyileşir.`;
    case "review_attention":
      return `${product.name} için tekrar eden yorum temaları görünür olur ve müşteri güvenini zedeleyen başlıklar aksiyona döner.`;
    case "reduce_return_risk":
      return `${product.name} iade sebebi yaratabilecek belirsizlikleri azaltır; ürün sayfası beklentiyi daha doğru yönetir.`;
    case "create_bundle":
      return `${product.name} tamamlayıcı ürünlerle daha anlamlı bir sepet senaryosuna bağlanır ve ortalama sepet değeri artabilir.`;
    case "promote_winner":
      return `${product.name} güçlü sağlık skorunu büyüme fırsatına çevirir; görünürlük kontrollü şekilde artırılır.`;
    case "protect_margin":
      return `${product.name} için fiyat, reklam ve iade baskısı birlikte ele alınır; büyüme kararı kârlılık zeminiyle verilir.`;
  }
}

function createMetricHighlights(
  type: SellerActionType,
  product: Product,
  scorecard: ProductScorecard,
  evidence: Record<string, unknown>,
): SellerActionMetricHighlight[] {
  switch (type) {
    case "restock":
      return [
        metric("Kullanılabilir stok", `${scorecard.inventory.evidence.availableStock} adet`, stockTone(scorecard)),
        metric("7 günlük tahmini talep", `${scorecard.inventory.evidence.forecastDemand7d} adet`, "neutral"),
        metric("Tahmini stok açığı", `${scorecard.inventory.evidence.projectedGap7d} adet`, gapTone(scorecard)),
        scoreMetric("Stok skoru", scorecard.inventory.score),
      ];
    case "pause_promotion":
      return [
        scoreMetric("Stok skoru", scorecard.inventory.score),
        scoreMetric("Kargo güveni", scorecard.shipping.score),
        metric("Reklam harcaması", formatTry(product.metrics.adSpend30d), "warning"),
        metric("Görüntülenme", `${product.metrics.views30d.toLocaleString("tr-TR")} adet`, "neutral"),
      ];
    case "fix_listing":
      return [
        scoreMetric("Listeleme skoru", scorecard.listing.score),
        scoreMetric("Özellik tamlığı", scorecard.listing.evidence.attributeCompleteness),
        scoreMetric("Görsel skoru", scorecard.listing.evidence.imageScore),
        metric("Dönüşüm oranı", formatPercent(product.metrics.conversionRate), "neutral"),
      ];
    case "review_attention":
      return [
        scoreMetric("Yorum güveni", scorecard.reviews.score),
        metric("Negatif yorum oranı", formatPercent(scorecard.reviews.evidence.negativeShare), "warning"),
        metric("Acil yorum", `${scorecard.reviews.evidence.attentionReviewCount} adet`, attentionTone(scorecard)),
        metric("Tekrar eden tema", scorecard.reviews.evidence.repeatedThemes.join(", ") || "Yok", "neutral"),
      ];
    case "reduce_return_risk":
      return [
        scoreMetric("İade güveni", scorecard.returns.score),
        metric("İade oranı", formatPercent(scorecard.returns.evidence.returnRate), "warning"),
        metric("Riskli yorum", `${scorecard.returns.evidence.riskyReviewCount} adet`, riskReviewTone(scorecard)),
        scoreMetric("Listeleme güveni", scorecard.listing.score),
      ];
    case "create_bundle":
      return [
        scoreMetric("Kampanya hazırlığı", scorecard.promotionReadiness.score),
        scoreMetric("Ürün sağlığı", scorecard.health.score),
        metric("İlişkili ürün", `${getRelatedProductCount(evidence)} aday`, "positive"),
        metric("Sepete ekleme", `${product.metrics.cartAdds30d} adet`, "neutral"),
      ];
    case "promote_winner":
      return [
        scoreMetric("Ürün sağlığı", scorecard.health.score),
        scoreMetric("Kampanya hazırlığı", scorecard.promotionReadiness.score),
        metric("Son 30 gün gelir", formatTry(product.metrics.revenue30d), "positive"),
        metric("Son 30 gün sipariş", `${product.metrics.orders30d} adet`, "positive"),
      ];
    case "protect_margin":
      return [
        scoreMetric("Kârlılık skoru", scorecard.profitability.score),
        metric("Brüt marj", formatTry(scorecard.profitability.evidence.grossMargin), marginTone(scorecard)),
        metric("Reklam/gelir oranı", formatPercent(scorecard.profitability.evidence.adSpendToRevenueRate), "warning"),
        metric("İade oranı", formatPercent(scorecard.profitability.evidence.returnRate), "warning"),
      ];
  }
}

function createTodayChecklist(
  type: SellerActionType,
  product: Product,
  scorecard: ProductScorecard,
): SellerActionChecklistItem[] {
  switch (type) {
    case "restock":
      return [
        checklistItem(
          "Stok ihtiyacını hesapla",
          `7 günlük tahmini talep ${scorecard.inventory.evidence.forecastDemand7d} adet; açığı ve lead time'ı birlikte kontrol et.`,
          "stok",
        ),
        checklistItem(
          "Kampanya temposunu sınırlı tut",
          "Stok yenilenene kadar ürünü agresif reklam veya vitrin desteğiyle büyütme.",
          "pazarlama",
        ),
      ];
    case "pause_promotion":
      return [
        checklistItem(
          "Reklam bütçesini dondur",
          "Stok ve kargo güveni toparlanana kadar yeni bütçe artırımı yapma.",
          "pazarlama",
        ),
        checklistItem(
          "Operasyon sebebini netleştir",
          `Stok ${scorecard.inventory.score}/100, kargo ${scorecard.shipping.score}/100; düşük sinyali hangi tarafın ürettiğini işaretle.`,
          "operasyon",
        ),
      ];
    case "fix_listing":
      return [
        checklistItem(
          "Eksik karar bilgisini tamamla",
          "Başlık, açıklama, teknik özellik ve görsel alanlarını alıcı sorularına göre güncelle.",
          "icerik",
        ),
        checklistItem(
          "Yorum kaynaklı belirsizliği kapat",
          "Boyut, uyumluluk veya renk beklentisi geçen yorumları ürün sayfasındaki net bilgiye çevir.",
          "icerik",
        ),
      ];
    case "review_attention":
      return [
        checklistItem(
          "Acil yorumları ayır",
          `${scorecard.reviews.evidence.attentionReviewCount} yorum satıcı aksiyonu gerektiriyor; önce tekrar eden temaları grupla.`,
          "destek",
        ),
        checklistItem(
          "Cevap ve düzeltme planı yaz",
          "Şikayeti sadece yanıtlamak yerine açıklama, kalite kontrol veya paketleme aksiyonuna bağla.",
          "destek",
        ),
      ];
    case "reduce_return_risk":
      return [
        checklistItem(
          "İade sebebini görünür yap",
          "Uyumluluk, ölçü, malzeme veya paketleme kaynaklı riski ürün sayfasında netleştir.",
          "icerik",
        ),
        checklistItem(
          "Riskli sipariş sinyalini izle",
          `Mevcut iade oranı ${formatPercent(product.metrics.returnRate)}; aksiyon sonrası yeni siparişleri karşılaştır.`,
          "operasyon",
        ),
      ];
    case "create_bundle":
      return [
        checklistItem(
          "Bundle hikayesini yaz",
          "Ürünleri sadece indirimle değil, birlikte kullanım senaryosuyla paketle.",
          "pazarlama",
        ),
        checklistItem(
          "Paket sınırlarını kontrol et",
          "Stok, marj ve kargo güveni düşük ürünü bundle içinde büyütmeden önce sınır koy.",
          "finans",
        ),
      ];
    case "promote_winner":
      return [
        checklistItem(
          "Vitrin adayını işaretle",
          `${product.name} sağlık ve kampanya sinyalleriyle büyütmeye aday; görünürlük testini düşük bütçeyle başlat.`,
          "pazarlama",
        ),
        checklistItem(
          "Stok emniyetini koru",
          "Büyütme başlamadan önce stok kapsamasını ve yeniden sipariş eşiğini kontrol et.",
          "stok",
        ),
      ];
    case "protect_margin":
      return [
        checklistItem(
          "Marj baskısını ayır",
          "Fiyat, birim maliyet, reklam/gelir oranı ve iade oranını aynı tabloda kontrol et.",
          "finans",
        ),
        checklistItem(
          "Büyütme kararını beklet",
          "Marj düzelmeden reklam veya kampanya büyütmesi yapma; önce kayıp kalemini azalt.",
          "pazarlama",
        ),
      ];
  }
}

function metric(
  label: string,
  value: string,
  tone: SellerActionMetricHighlight["tone"],
  helperText?: string,
): SellerActionMetricHighlight {
  return { label, value, tone, helperText };
}

function scoreMetric(label: string, score: number): SellerActionMetricHighlight {
  return metric(label, `${score}/100`, scoreTone(score));
}

function checklistItem(
  label: string,
  detail: string,
  owner: SellerActionChecklistItem["owner"],
): SellerActionChecklistItem {
  return { label, detail, owner };
}

function scoreTone(score: number): SellerActionMetricHighlight["tone"] {
  if (score < 45) {
    return "danger";
  }

  if (score < 70) {
    return "warning";
  }

  if (score >= 80) {
    return "positive";
  }

  return "neutral";
}

function stockTone(scorecard: ProductScorecard): SellerActionMetricHighlight["tone"] {
  if (scorecard.inventory.evidence.projectedGap7d > 0) {
    return "danger";
  }

  if (scorecard.inventory.evidence.availableStock <= scorecard.inventory.evidence.reorderPoint) {
    return "warning";
  }

  return "neutral";
}

function gapTone(scorecard: ProductScorecard): SellerActionMetricHighlight["tone"] {
  return scorecard.inventory.evidence.projectedGap7d > 0 ? "danger" : "positive";
}

function attentionTone(scorecard: ProductScorecard): SellerActionMetricHighlight["tone"] {
  if (scorecard.reviews.evidence.attentionReviewCount >= 3) {
    return "danger";
  }

  if (scorecard.reviews.evidence.attentionReviewCount > 0) {
    return "warning";
  }

  return "positive";
}

function riskReviewTone(scorecard: ProductScorecard): SellerActionMetricHighlight["tone"] {
  if (scorecard.returns.evidence.riskyReviewCount >= 3) {
    return "danger";
  }

  if (scorecard.returns.evidence.riskyReviewCount > 0) {
    return "warning";
  }

  return "positive";
}

function marginTone(scorecard: ProductScorecard): SellerActionMetricHighlight["tone"] {
  return scorecard.profitability.evidence.grossMargin > 0 ? "neutral" : "danger";
}

function getRelatedProductCount(evidence: Record<string, unknown>): number {
  return Array.isArray(evidence.relatedProducts) ? evidence.relatedProducts.length : 0;
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
