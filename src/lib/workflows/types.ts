import type { ProductScorecard } from "@/lib/scoring";
import type { BuyerSensitivity, ProductCategory, ReviewTheme } from "@/types/commerce";

export type SellerActionType =
  | "restock"
  | "pause_promotion"
  | "fix_listing"
  | "review_attention"
  | "reduce_return_risk"
  | "create_bundle"
  | "promote_winner"
  | "protect_margin";

export type SellerActionCategory =
  | "inventory"
  | "operations"
  | "content"
  | "customer_voice"
  | "returns"
  | "campaign"
  | "growth"
  | "profitability";

export type SellerActionUrgency = "critical" | "high" | "medium" | "low";

export type SellerActionImpactLevel = "high" | "medium" | "low";

export type SellerActionEffortLevel = "low" | "medium" | "high";

export type SellerActionTimeHorizon = "today" | "this_week" | "monitor";

export type SellerActionMetricTone = "positive" | "neutral" | "warning" | "danger";

export type SellerActionOwner =
  | "stok"
  | "operasyon"
  | "icerik"
  | "destek"
  | "pazarlama"
  | "finans";

export interface SellerActionMetricHighlight {
  label: string;
  value: string;
  tone: SellerActionMetricTone;
  helperText?: string;
}

export interface SellerActionChecklistItem {
  label: string;
  detail: string;
  owner: SellerActionOwner;
}

export interface LlmReadyContext {
  task: string;
  locale: "tr-TR";
  audience: "seller" | "buyer";
  facts: Record<string, unknown>;
  instruction: string;
}

export interface SellerGrowthAction {
  id: string;
  type: SellerActionType;
  title: string;
  summary: string;
  priorityScore: number;
  category: SellerActionCategory;
  categoryLabel: string;
  urgency: SellerActionUrgency;
  urgencyLabel: string;
  impactLevel: SellerActionImpactLevel;
  impactLabel: string;
  effortLevel: SellerActionEffortLevel;
  effortLabel: string;
  timeHorizon: SellerActionTimeHorizon;
  timeHorizonLabel: string;
  expectedOutcome: string;
  metricHighlights: SellerActionMetricHighlight[];
  todayChecklist: SellerActionChecklistItem[];
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

export type BuyerIntentType =
  | "home_office_setup"
  | "coffee_starter"
  | "gift_finder"
  | "sports_audio"
  | "meeting_setup"
  | "desk_style_set"
  | "generic";

export interface BuyerManualPreferences {
  sensitivities?: BuyerSensitivity[];
  preferredColors?: string[];
  avoidReviewThemes?: ReviewTheme[];
  preferredUseCases?: string[];
  maxDeliveryDays?: number;
}

export interface BuyerSmartCartWorkflowInput {
  buyerId?: string;
  prompt: string;
  manualPreferences?: BuyerManualPreferences;
}

export interface ParsedBuyerIntent {
  type: BuyerIntentType;
  prompt: string;
  budget?: number;
  softBudgetLimit?: number;
  budgetToleranceRate: number;
  categories: ProductCategory[];
  useCases: string[];
  requestedColors: string[];
  sensitivities: BuyerSensitivity[];
  maxDeliveryDays?: number;
  keywords: string[];
}

export interface BuyerSmartCartItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  cartRoleKey: string;
  cartRole: string;
  price: number;
  quantity: number;
  confidenceScore: number;
  reasons: string[];
  warnings: BuyerCartWarning[];
  evidence: Record<string, unknown>;
}

export interface BuyerCartWarning {
  productId?: string;
  severity: "info" | "caution";
  title: string;
  message: string;
  evidence: Record<string, unknown>;
}

export interface BuyerProductSuggestion {
  productId: string;
  productName: string;
  price: number;
  reason: string;
  confidenceScore: number;
}

export interface BuyerSellerSignalCandidate {
  type:
    | "buyer_demand"
    | "shipping_friction"
    | "review_friction"
    | "bundle_opportunity"
    | "color_demand";
  productIds: string[];
  summary: string;
  evidence: Record<string, unknown>;
}

export interface BuyerSmartCartWorkflowResult {
  buyerId?: string;
  buyerName?: string;
  generatedAt: string;
  prompt: string;
  intent: ParsedBuyerIntent;
  budget?: number;
  softBudgetLimit?: number;
  totalPrice: number;
  remainingBudget?: number;
  isOverRequestedBudget: boolean;
  isOverSoftBudget: boolean;
  confidenceScore: number;
  selectedItems: BuyerSmartCartItem[];
  warnings: BuyerCartWarning[];
  alternatives: BuyerProductSuggestion[];
  complementarySuggestions: BuyerProductSuggestion[];
  buyerPersonalizationNotes: string[];
  sellerSignalCandidates: BuyerSellerSignalCandidate[];
  llmReadyContext: LlmReadyContext;
}
