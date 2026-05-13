import type { Product, Review } from "@/types/commerce";
import { clampScore, toPercent, type ExplainableScore } from "./common";

export interface ShippingConfidenceEvidence extends Record<string, unknown> {
  deliveryPromiseDays: number;
  averageDeliveryDays: number;
  promiseGapDays: number;
  fastShippingRate: number;
  lateDeliveryComplaintRate: number;
  reviewCountMentioningShipping: number;
  lateShippingReviewCount: number;
}

export type ShippingConfidenceScore = ExplainableScore<ShippingConfidenceEvidence>;

export function scoreShippingConfidence(product: Product, reviews: Review[]): ShippingConfidenceScore {
  const shippingReviews = reviews.filter((review) => review.themes.includes("kargo-hizi"));
  const lateShippingReviews = shippingReviews.filter(
    (review) => review.deliveryDays > product.fulfillment.deliveryPromiseDays,
  );
  const promiseGapDays = Math.max(
    0,
    product.fulfillment.averageDeliveryDays - product.fulfillment.deliveryPromiseDays,
  );
  const promisePenalty = Math.min(30, promiseGapDays * 18);
  const complaintPenalty = product.fulfillment.lateDeliveryComplaintRate * 45;
  const reviewPenalty =
    shippingReviews.length > 0 ? (lateShippingReviews.length / shippingReviews.length) * 25 : 0;
  const score = clampScore(
    product.fulfillment.fastShippingRate * 100 - promisePenalty - complaintPenalty - reviewPenalty,
  );
  const drivers = [
    `Teslimat vaadi: ${product.fulfillment.deliveryPromiseDays} gün`,
    `Ortalama teslimat: ${product.fulfillment.averageDeliveryDays} gün`,
    `Hızlı kargo oranı: %${toPercent(product.fulfillment.fastShippingRate)}`,
    `Geç teslim şikayet oranı: %${toPercent(product.fulfillment.lateDeliveryComplaintRate)}`,
  ];

  if (lateShippingReviews.length > 0) {
    drivers.push(`${lateShippingReviews.length} yorumda teslimat vaadi aşılmış görünüyor`);
  }

  return {
    score,
    label: score >= 75 ? "Kargo güveni güçlü" : "Kargo güveni zayıf",
    summary:
      score >= 75
        ? `${product.name} için teslimat sinyalleri alıcıya güven veriyor.`
        : `${product.name} teslimat vaadi ile gerçekleşen kargo deneyimi arasında güven zayıflatan sinyaller taşıyor.`,
    drivers,
    evidence: {
      deliveryPromiseDays: product.fulfillment.deliveryPromiseDays,
      averageDeliveryDays: product.fulfillment.averageDeliveryDays,
      promiseGapDays,
      fastShippingRate: product.fulfillment.fastShippingRate,
      lateDeliveryComplaintRate: product.fulfillment.lateDeliveryComplaintRate,
      reviewCountMentioningShipping: shippingReviews.length,
      lateShippingReviewCount: lateShippingReviews.length,
    },
    recommendedFocus:
      score >= 75
        ? "Hızlı teslimat buyer filtrelerinde avantaj olarak kullanılabilir."
        : "Teslimat vaadi gerçek deneyime göre güncellenmeli veya hızlı kargo hassasiyeti olan alıcılara uyarı gösterilmeli.",
  };
}
