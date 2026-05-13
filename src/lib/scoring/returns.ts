import type { Order, Product, Review } from "@/types/commerce";
import { clampScore, toPercent, type ExplainableScore } from "./common";

export interface ReturnConfidenceEvidence extends Record<string, unknown> {
  returnRate: number;
  returnedOrderCount: number;
  riskyReviewCount: number;
  riskyThemes: string[];
}

export type ReturnConfidenceScore = ExplainableScore<ReturnConfidenceEvidence>;

const returnRiskThemes = new Set(["iade-riski", "uyumluluk", "boyut", "malzeme-kalitesi", "paketleme"]);

export function scoreReturnConfidence(
  product: Product,
  reviews: Review[],
  orders: Order[],
): ReturnConfidenceScore {
  const returnedOrders = orders.filter((order) => order.returnedProductIds.includes(product.id));
  const riskyReviews = reviews.filter((review) =>
    review.themes.some((theme) => returnRiskThemes.has(theme)),
  );
  const riskyThemes = Array.from(
    new Set(riskyReviews.flatMap((review) => review.themes.filter((theme) => returnRiskThemes.has(theme)))),
  );
  const returnRatePenalty = product.metrics.returnRate * 80;
  const returnedOrderPenalty = Math.min(20, returnedOrders.length * 7);
  const riskyReviewPenalty = reviews.length > 0 ? (riskyReviews.length / reviews.length) * 35 : 0;
  const score = clampScore(100 - returnRatePenalty - returnedOrderPenalty - riskyReviewPenalty);
  const drivers = [
    `Ürün iade oranı: %${toPercent(product.metrics.returnRate)}`,
    `Mock siparişlerde iade adedi: ${returnedOrders.length}`,
    `İade riski taşıyan yorum adedi: ${riskyReviews.length}`,
  ];

  if (riskyThemes.length > 0) {
    drivers.push(`İade riskini besleyen temalar: ${riskyThemes.join(", ")}`);
  }

  return {
    score,
    label: score >= 75 ? "İade güveni güçlü" : "İade riski izlenmeli",
    summary:
      score >= 75
        ? `${product.name} için iade sinyalleri kontrol altında.`
        : `${product.name} için iade riski yorumlar, siparişler veya ürün metrikleriyle görünür hale geliyor.`,
    drivers,
    evidence: {
      returnRate: product.metrics.returnRate,
      returnedOrderCount: returnedOrders.length,
      riskyReviewCount: riskyReviews.length,
      riskyThemes,
    },
    recommendedFocus:
      score >= 75
        ? "İade riski düşük; kampanya kararında diğer sinyaller kullanılabilir."
        : "Uyumluluk, ölçü, paketleme veya kalite beklentisi ürün sayfasında daha net yönetilmeli.",
  };
}
