import { reviews } from "@/data/mock/reviews";
import type { Review, ReviewSentiment, ReviewTheme } from "@/types/commerce";

export function getReviews(): Review[] {
  return reviews;
}

export function getReviewById(reviewId: string): Review | undefined {
  return reviews.find((review) => review.id === reviewId);
}

export function getReviewsByProductId(productId: string): Review[] {
  return reviews.filter((review) => review.productId === productId);
}

export function getReviewsByBuyerId(buyerId: string): Review[] {
  return reviews.filter((review) => review.buyerId === buyerId);
}

export function getReviewsByTheme(theme: ReviewTheme): Review[] {
  return reviews.filter((review) => review.themes.includes(theme));
}

export function getReviewsBySentiment(sentiment: ReviewSentiment): Review[] {
  return reviews.filter((review) => review.sentiment === sentiment);
}

export function getReviewsNeedingSellerAttention(): Review[] {
  return reviews.filter((review) => review.needsSellerAttention);
}

export function getReviewsNeedingAttentionByProductId(productId: string): Review[] {
  return reviews.filter(
    (review) => review.productId === productId && review.needsSellerAttention,
  );
}

export function getNegativeReviewsByProductId(productId: string): Review[] {
  return reviews.filter((review) => review.productId === productId && review.sentiment === "negative");
}
