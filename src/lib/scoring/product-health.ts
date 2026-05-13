import type { ProductDetail } from "@/lib/data";
import type { ExplainableScore } from "./common";
import { clampScore, weightedAverage } from "./common";
import { scoreInventoryCoverage, type InventoryCoverageScore } from "./inventory";
import { scoreListingConfidence, type ListingConfidenceScore } from "./listing";
import {
  scoreProfitConfidence,
  type ProfitConfidenceScore,
} from "./profitability";
import {
  scorePromotionReadiness,
  type PromotionReadinessScore,
} from "./promotion-readiness";
import { scoreReturnConfidence, type ReturnConfidenceScore } from "./returns";
import { scoreReviewConfidence, type ReviewConfidenceScore } from "./reviews";
import { scoreShippingConfidence, type ShippingConfidenceScore } from "./shipping";

export interface ProductHealthEvidence extends Record<string, unknown> {
  inventoryCoverageScore: number;
  reviewConfidenceScore: number;
  listingConfidenceScore: number;
  shippingConfidenceScore: number;
  returnConfidenceScore: number;
  profitConfidenceScore: number;
  promotionReadinessScore: number;
  conversionRate: number;
}

export type ProductHealthScore = ExplainableScore<ProductHealthEvidence>;

export interface ProductScorecard {
  productId: string;
  productName: string;
  inventory: InventoryCoverageScore;
  reviews: ReviewConfidenceScore;
  listing: ListingConfidenceScore;
  shipping: ShippingConfidenceScore;
  returns: ReturnConfidenceScore;
  profitability: ProfitConfidenceScore;
  promotionReadiness: PromotionReadinessScore;
  health: ProductHealthScore;
}

export function scoreProduct(detail: ProductDetail): ProductScorecard {
  const inventory = scoreInventoryCoverage(detail.product);
  const reviews = scoreReviewConfidence(detail.product, detail.reviews);
  const listing = scoreListingConfidence(detail.product, detail.reviews);
  const shipping = scoreShippingConfidence(detail.product, detail.reviews);
  const returns = scoreReturnConfidence(detail.product, detail.reviews, detail.orders);
  const profitability = scoreProfitConfidence(detail.product);
  const promotionReadiness = scorePromotionReadiness({
    productName: detail.product.name,
    inventory,
    reviews,
    listing,
    shipping,
    returns,
    profitability,
  });
  const health = scoreProductHealth({
    productName: detail.product.name,
    conversionRate: detail.product.metrics.conversionRate,
    inventory,
    reviews,
    listing,
    shipping,
    returns,
    profitability,
    promotionReadiness,
  });

  return {
    productId: detail.product.id,
    productName: detail.product.name,
    inventory,
    reviews,
    listing,
    shipping,
    returns,
    profitability,
    promotionReadiness,
    health,
  };
}

interface ProductHealthInput {
  productName: string;
  conversionRate: number;
  inventory: InventoryCoverageScore;
  reviews: ReviewConfidenceScore;
  listing: ListingConfidenceScore;
  shipping: ShippingConfidenceScore;
  returns: ReturnConfidenceScore;
  profitability: ProfitConfidenceScore;
  promotionReadiness: PromotionReadinessScore;
}

function scoreProductHealth(input: ProductHealthInput): ProductHealthScore {
  const conversionComponent = clampScore(input.conversionRate * 1200);
  const score = clampScore(
    weightedAverage([
      { value: input.inventory.score, weight: 0.18 },
      { value: input.reviews.score, weight: 0.18 },
      { value: input.listing.score, weight: 0.14 },
      { value: input.shipping.score, weight: 0.12 },
      { value: input.returns.score, weight: 0.12 },
      { value: input.profitability.score, weight: 0.14 },
      { value: input.promotionReadiness.score, weight: 0.08 },
      { value: conversionComponent, weight: 0.04 },
    ]),
  );
  const dimensions = [
    input.inventory,
    input.reviews,
    input.listing,
    input.shipping,
    input.returns,
    input.profitability,
    input.promotionReadiness,
  ];
  const lowestDimensions = [...dimensions].sort((first, second) => first.score - second.score).slice(0, 2);
  const drivers = [
    `En zayıf sinyaller: ${lowestDimensions.map((dimension) => `${dimension.label} (${dimension.score}/100)`).join(", ")}`,
    `Dönüşüm bileşeni: ${conversionComponent}/100`,
    ...lowestDimensions.flatMap((dimension) => dimension.drivers.slice(0, 2)),
  ];

  return {
    score,
    label: score >= 75 ? "Ürün sağlığı güçlü" : "Ürün sağlığı iyileştirilmeli",
    summary:
      score >= 75
        ? `${input.productName} genel ürün sağlığı açısından büyütmeye uygun sinyaller taşıyor.`
        : `${input.productName} için büyüme kararı verilmeden önce düşük skor üreten sinyaller ele alınmalı.`,
    drivers,
    evidence: {
      inventoryCoverageScore: input.inventory.score,
      reviewConfidenceScore: input.reviews.score,
      listingConfidenceScore: input.listing.score,
      shippingConfidenceScore: input.shipping.score,
      returnConfidenceScore: input.returns.score,
      profitConfidenceScore: input.profitability.score,
      promotionReadinessScore: input.promotionReadiness.score,
      conversionRate: input.conversionRate,
    },
    recommendedFocus:
      score >= 75
        ? "Ürün büyütme, bundle veya kampanya kararlarında aday olarak kullanılabilir."
        : lowestDimensions[0]?.recommendedFocus ?? "En düşük skor üreten sinyal iyileştirilmeli.",
  };
}
