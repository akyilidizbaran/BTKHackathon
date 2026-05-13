import type { ExplainableScore } from "./common";
import { clampScore, weightedAverage } from "./common";
import type { InventoryCoverageScore } from "./inventory";
import type { ListingConfidenceScore } from "./listing";
import type { ProfitConfidenceScore } from "./profitability";
import type { ReturnConfidenceScore } from "./returns";
import type { ReviewConfidenceScore } from "./reviews";
import type { ShippingConfidenceScore } from "./shipping";

export interface PromotionReadinessEvidence extends Record<string, unknown> {
  inventoryCoverageScore: number;
  reviewConfidenceScore: number;
  listingConfidenceScore: number;
  shippingConfidenceScore: number;
  returnConfidenceScore: number;
  profitConfidenceScore: number;
}

export type PromotionReadinessScore = ExplainableScore<PromotionReadinessEvidence>;

export interface PromotionReadinessInput {
  productName: string;
  inventory: InventoryCoverageScore;
  reviews: ReviewConfidenceScore;
  listing: ListingConfidenceScore;
  shipping: ShippingConfidenceScore;
  returns: ReturnConfidenceScore;
  profitability: ProfitConfidenceScore;
}

export function scorePromotionReadiness(input: PromotionReadinessInput): PromotionReadinessScore {
  const score = clampScore(
    weightedAverage([
      { value: input.inventory.score, weight: 0.24 },
      { value: input.reviews.score, weight: 0.18 },
      { value: input.listing.score, weight: 0.16 },
      { value: input.shipping.score, weight: 0.15 },
      { value: input.returns.score, weight: 0.12 },
      { value: input.profitability.score, weight: 0.15 },
    ]),
  );
  const weakSignals = [
    input.inventory,
    input.reviews,
    input.listing,
    input.shipping,
    input.returns,
    input.profitability,
  ].filter((item) => item.score < 70);
  const drivers = [
    `Stok kapsaması: ${input.inventory.score}/100`,
    `Yorum güveni: ${input.reviews.score}/100`,
    `Listeleme güveni: ${input.listing.score}/100`,
    `Kargo güveni: ${input.shipping.score}/100`,
    `İade güveni: ${input.returns.score}/100`,
    `Kârlılık güveni: ${input.profitability.score}/100`,
  ];

  if (weakSignals.length > 0) {
    drivers.push(`Kampanya öncesi zayıf sinyaller: ${weakSignals.map((item) => item.label).join(", ")}`);
  }

  return {
    score,
    label: score >= 75 ? "Kampanyaya hazır" : "Kampanya öncesi iyileştirme gerekiyor",
    summary:
      score >= 75
        ? `${input.productName} stok, yorum, kargo ve kârlılık sinyalleriyle kampanya/bundle için hazır görünüyor.`
        : `${input.productName} kampanyaya alınmadan önce bazı operasyonel veya içerik riskleri iyileştirilmeli.`,
    drivers,
    evidence: {
      inventoryCoverageScore: input.inventory.score,
      reviewConfidenceScore: input.reviews.score,
      listingConfidenceScore: input.listing.score,
      shippingConfidenceScore: input.shipping.score,
      returnConfidenceScore: input.returns.score,
      profitConfidenceScore: input.profitability.score,
    },
    recommendedFocus:
      score >= 75
        ? "Ürün kampanya, bundle veya vitrin desteği için değerlendirilebilir."
        : "Kampanya kararı verilmeden önce en düşük skor üreten sinyal iyileştirilmeli.",
  };
}
