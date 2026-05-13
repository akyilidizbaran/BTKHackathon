import type { ProductScorecard } from "@/lib/scoring";

export type SellerActionType =
  | "restock"
  | "pause_promotion"
  | "fix_listing"
  | "review_attention"
  | "reduce_return_risk"
  | "create_bundle"
  | "promote_winner"
  | "protect_margin";

export interface LlmReadyContext {
  task: string;
  locale: "tr-TR";
  audience: "seller";
  facts: Record<string, unknown>;
  instruction: string;
}

export interface SellerGrowthAction {
  id: string;
  type: SellerActionType;
  title: string;
  summary: string;
  priorityScore: number;
  productIds: string[];
  reasoning: string[];
  evidence: Record<string, unknown>;
  recommendedNextStep: string;
  llmReadyContext: LlmReadyContext;
}

export interface SellerActionsWorkflowResult {
  sellerId: string;
  sellerName: string;
  generatedAt: string;
  actions: SellerGrowthAction[];
  analyzedProductCount: number;
}

export interface ProductHealthInsight {
  title: string;
  summary: string;
  score: number;
  evidence: Record<string, unknown>;
  recommendedFocus: string;
}

export interface ProductHealthWorkflowResult {
  productId: string;
  productName: string;
  scorecard: ProductScorecard;
  topInsights: ProductHealthInsight[];
  llmReadyContext: LlmReadyContext;
}
