import type { Product, Review } from "@/types/commerce";
import { clampScore, type ExplainableScore } from "./common";

export interface ListingConfidenceEvidence extends Record<string, unknown> {
  qualityScore: number;
  attributeCompleteness: number;
  imageScore: number;
  issueTags: string[];
  reviewCountMentioningMismatch: number;
}

export type ListingConfidenceScore = ExplainableScore<ListingConfidenceEvidence>;

const listingMismatchThemes = new Set(["boyut", "uyumluluk", "renk-uyumu"]);

export function scoreListingConfidence(product: Product, reviews: Review[]): ListingConfidenceScore {
  const mismatchReviewCount = reviews.filter((review) =>
    review.themes.some((theme) => listingMismatchThemes.has(theme)),
  ).length;
  const issuePenalty = Math.min(20, product.listing.issueTags.length * 5);
  const mismatchPenalty = Math.min(15, mismatchReviewCount * 4);
  const score = clampScore(
    product.listing.qualityScore * 0.45 +
      product.listing.attributeCompleteness * 0.3 +
      product.listing.imageScore * 0.25 -
      issuePenalty -
      mismatchPenalty,
  );
  const drivers = [
    `Listeleme kalite skoru: ${product.listing.qualityScore}/100`,
    `Özellik tamlığı: ${product.listing.attributeCompleteness}/100`,
    `Görsel skoru: ${product.listing.imageScore}/100`,
  ];

  if (product.listing.issueTags.length > 0) {
    drivers.push(`Listeleme sorunları: ${product.listing.issueTags.join(", ")}`);
  }

  if (mismatchReviewCount > 0) {
    drivers.push(`${mismatchReviewCount} yorum ürün beklentisi veya uyumluluk belirsizliği taşıyor`);
  }

  return {
    score,
    label: score >= 75 ? "Listeleme güveni güçlü" : "Listeleme güveni geliştirilmeli",
    summary:
      score >= 75
        ? `${product.name} listelemesi alıcıya yeterli karar bilgisi veriyor.`
        : `${product.name} listelemesinde açıklama, görsel veya özellik netliği satış kararını zayıflatabilir.`,
    drivers,
    evidence: {
      qualityScore: product.listing.qualityScore,
      attributeCompleteness: product.listing.attributeCompleteness,
      imageScore: product.listing.imageScore,
      issueTags: product.listing.issueTags,
      reviewCountMentioningMismatch: mismatchReviewCount,
    },
    recommendedFocus:
      score >= 75
        ? "Listeleme korunabilir; kampanya veya bundle kararında diğer sinyaller incelenmeli."
        : "Ürün açıklaması, uyumluluk/spec bilgisi ve görseller alıcı beklentisini netleştirecek şekilde iyileştirilmeli.",
  };
}
