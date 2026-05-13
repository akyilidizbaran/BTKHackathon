import { getProductDetail } from "@/lib/data";
import type { ExplainableScore } from "@/lib/scoring";
import { scoreProduct } from "@/lib/scoring";
import type { ProductHealthInsight, ProductHealthWorkflowResult } from "./types";

export function analyzeProductHealthWorkflow(
  productId: string,
): ProductHealthWorkflowResult | undefined {
  const detail = getProductDetail(productId);

  if (!detail) {
    return undefined;
  }

  const scorecard = scoreProduct(detail);
  const topInsights = getTopInsights([
    scorecard.inventory,
    scorecard.reviews,
    scorecard.listing,
    scorecard.shipping,
    scorecard.returns,
    scorecard.profitability,
    scorecard.promotionReadiness,
  ]);

  return {
    productId: detail.product.id,
    productName: detail.product.name,
    scorecard,
    topInsights,
    llmReadyContext: {
      task: "product_health_explanation",
      locale: "tr-TR",
      audience: "seller",
      facts: {
        productId: detail.product.id,
        productName: detail.product.name,
        healthScore: scorecard.health.score,
        healthSummary: scorecard.health.summary,
        topInsights,
      },
      instruction:
        "Bu ürün sağlık analizini satıcıya kısa, aksiyon odaklı ve kanıta dayalı Türkçe ile açıkla.",
    },
  };
}

function getTopInsights(scores: ExplainableScore[]): ProductHealthInsight[] {
  return [...scores]
    .sort((first, second) => first.score - second.score)
    .slice(0, 3)
    .map((score) => ({
      title: score.label,
      summary: score.summary,
      score: score.score,
      evidence: score.evidence,
      recommendedFocus: score.recommendedFocus,
    }));
}
