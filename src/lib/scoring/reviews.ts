import type { Product, Review, ReviewTheme } from "@/types/commerce";
import { clampScore, countBy, toPercent, topEntries, type ExplainableScore } from "./common";

export interface ReviewConfidenceEvidence extends Record<string, unknown> {
  reviewCount: number;
  negativeReviewCount: number;
  attentionReviewCount: number;
  negativeShare: number;
  attentionShare: number;
  repeatedThemes: ReviewTheme[];
  ratingAverage: number;
}

export type ReviewConfidenceScore = ExplainableScore<ReviewConfidenceEvidence>;

export function scoreReviewConfidence(product: Product, reviews: Review[]): ReviewConfidenceScore {
  const negativeReviews = reviews.filter((review) => review.sentiment === "negative");
  const attentionReviews = reviews.filter((review) => review.needsSellerAttention);
  const negativeShare = reviews.length > 0 ? negativeReviews.length / reviews.length : 0;
  const attentionShare = reviews.length > 0 ? attentionReviews.length / reviews.length : 0;
  const themeCounts = countBy(reviews.flatMap((review) => review.themes));
  const repeatedThemes = topEntries(themeCounts, 4).filter((theme) => themeCounts[theme] > 1);
  const score = clampScore(
    product.metrics.ratingAverage * 20 -
      negativeShare * 35 -
      attentionShare * 30 -
      Math.min(15, repeatedThemes.length * 4),
  );
  const drivers = [
    `Ortalama puan: ${product.metrics.ratingAverage}/5`,
    `Negatif yorum oranı: %${toPercent(negativeShare)}`,
    `Satıcı aksiyonu gerektiren yorum oranı: %${toPercent(attentionShare)}`,
  ];

  if (repeatedThemes.length > 0) {
    drivers.push(`Tekrar eden yorum temaları: ${repeatedThemes.join(", ")}`);
  }

  return {
    score,
    label: score >= 75 ? "Yorum güveni güçlü" : "Yorum güveni risk taşıyor",
    summary:
      score >= 75
        ? `${product.name} yorumları genel olarak güven veriyor.`
        : `${product.name} yorumlarında alıcı kararını etkileyebilecek tekrar eden tema veya negatif deneyim var.`,
    drivers,
    evidence: {
      reviewCount: reviews.length,
      negativeReviewCount: negativeReviews.length,
      attentionReviewCount: attentionReviews.length,
      negativeShare,
      attentionShare,
      repeatedThemes,
      ratingAverage: product.metrics.ratingAverage,
    },
    recommendedFocus:
      score >= 75
        ? "Yorum sinyali güçlü; ürün büyütme veya bundle için değerlendirilebilir."
        : "Tekrar eden şikayet temaları ürün açıklaması, kalite kontrol veya müşteri mesajı ile ele alınmalı.",
  };
}
