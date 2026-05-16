import {
  buyerSmartCartExamples,
  getBuyerSmartCartApiData,
  validateBuyerSmartCartRequest,
  type BuyerSmartCartApiData,
  type BuyerSmartCartApiRequest,
  type BuyerSmartCartValidationResult,
} from "@/lib/api/buyer";
import {
  getBuyerCatalogApiData,
  type BuyerCatalogProductCard,
} from "@/lib/api/buyer-catalog";
import {
  createAgentRuntimeSnapshot,
  type AgentRuntimeSnapshot,
} from "@/lib/agents/runtime";
import {
  buyerAgentApplyEndpoint,
  createBuyerAgentApplyPreview,
  getBuyerAgentApplyApiData,
  validateBuyerAgentApplyRequest,
  type BuyerAgentApplyApiData,
  type BuyerAgentApplyPreview,
  type BuyerAgentApplyRequest,
  type BuyerAgentApplyRequestItem,
  type BuyerAgentApplyStrategy,
  type BuyerAgentApplyValidationError,
  type BuyerAgentApplyValidationResult,
  type BuyerAgentApplyValidationSuccess,
} from "@/lib/agents/buyer-cart-apply";
import type {
  BuyerCartWarning,
  BuyerProductSuggestion,
  BuyerSmartCartItem,
} from "@/lib/workflows";

export const buyerAgentEndpoint = "/api/buyer/agent";
export { buyerAgentApplyEndpoint, getBuyerAgentApplyApiData, validateBuyerAgentApplyRequest };
export type {
  BuyerAgentApplyApiData,
  BuyerAgentApplyPreview,
  BuyerAgentApplyRequest,
  BuyerAgentApplyRequestItem,
  BuyerAgentApplyStrategy,
  BuyerAgentApplyValidationError,
  BuyerAgentApplyValidationResult,
  BuyerAgentApplyValidationSuccess,
};

export interface BuyerAgentApiContractMeta {
  envelope: "success/data/error";
  source: "buyer-agent-smart-cart";
  generatedAt: string;
  endpoint: typeof buyerAgentEndpoint;
  method: "POST";
}

export interface BuyerAgentApiData {
  contract: BuyerAgentApiContractMeta;
  request: BuyerSmartCartApiRequest;
  message: {
    role: "assistant";
    content: string;
    confirmationQuestion: string;
  };
  summary: {
    itemCount: number;
    totalPrice: number;
    confidenceScore: number;
    warningCount: number;
    intentLabel: string;
    budgetStatusLabel: string;
  };
  recommendations: BuyerAgentRecommendation[];
  warnings: BuyerCartWarning[];
  alternatives: BuyerAgentSuggestion[];
  complementarySuggestions: BuyerAgentSuggestion[];
  sourceSmartCart: BuyerSmartCartApiData;
  runtime: AgentRuntimeSnapshot;
  applyPreview: BuyerAgentApplyPreview;
}

export interface BuyerAgentRecommendation {
  item: BuyerSmartCartItem;
  product: BuyerCatalogProductCard;
  primaryReason: string;
  warningTitles: string[];
}

export interface BuyerAgentSuggestion {
  suggestion: BuyerProductSuggestion;
  product?: BuyerCatalogProductCard;
}

export function getDefaultBuyerAgentApiData(): BuyerAgentApiData {
  const defaultExample = buyerSmartCartExamples[0];

  return getBuyerAgentApiData({
    buyerId: defaultExample.buyerId,
    prompt: defaultExample.prompt,
  });
}

export function validateBuyerAgentRequest(rawInput: unknown): BuyerSmartCartValidationResult {
  return validateBuyerSmartCartRequest(rawInput);
}

export function getBuyerAgentApiData(request: BuyerSmartCartApiRequest): BuyerAgentApiData {
  const sourceSmartCart = getBuyerSmartCartApiData(request);
  const catalogProducts = getBuyerCatalogApiData().products;
  const productById = new Map(catalogProducts.map((product) => [product.id, product]));
  const recommendations = sourceSmartCart.result.selectedItems
    .map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        return undefined;
      }

      return {
        item,
        product,
        primaryReason: createRecommendationReason(item, product),
        warningTitles: item.warnings.map((warning) => warning.title),
      };
    })
    .filter((item): item is BuyerAgentRecommendation => Boolean(item));
  const runtime = createAgentRuntimeSnapshot({
    actorId: sourceSmartCart.request.buyerId ?? "buyer-aylin",
    prompt: sourceSmartCart.request.prompt,
    role: "buyer",
    routeContext: "/buyer/agent",
    surface: "route",
  });
  const applyPreview = createBuyerAgentApplyPreview({
    items: recommendations.map((recommendation) => ({
      productId: recommendation.product.id,
      quantity: recommendation.item.quantity,
    })),
  });

  return {
    contract: {
      envelope: "success/data/error",
      source: "buyer-agent-smart-cart",
      generatedAt: sourceSmartCart.contract.generatedAt,
      endpoint: buyerAgentEndpoint,
      method: "POST",
    },
    request: sourceSmartCart.request,
    message: {
      role: "assistant",
      content: createAgentMessage(sourceSmartCart),
      confirmationQuestion: "Bu seçkiyi sepete ekleyeyim mi?",
    },
    summary: {
      budgetStatusLabel: sourceSmartCart.summary.budgetStatusLabel,
      confidenceScore: sourceSmartCart.summary.confidenceScore,
      intentLabel: sourceSmartCart.summary.intentLabel,
      itemCount: recommendations.length,
      totalPrice: sourceSmartCart.summary.totalPrice,
      warningCount: sourceSmartCart.summary.warningCount,
    },
    recommendations,
    warnings: sourceSmartCart.result.warnings,
    alternatives: mapSuggestions(sourceSmartCart.result.alternatives, productById),
    applyPreview,
    complementarySuggestions: mapSuggestions(sourceSmartCart.result.complementarySuggestions, productById),
    sourceSmartCart,
    runtime,
  };
}

function createAgentMessage(data: BuyerSmartCartApiData): string {
  const itemNames = data.result.selectedItems.map((item) => item.productName).slice(0, 3);
  const productPhrase = itemNames.length > 0 ? itemNames.join(", ") : "uygun ürünleri";

  return `${data.summary.intentLabel} için katalogdan ${data.summary.itemCount} ürün seçtim: ${productPhrase}. ${data.summary.budgetStatusLabel} ve güven skoru ${data.summary.confidenceScore}/100.`;
}

function createRecommendationReason(item: BuyerSmartCartItem, product: BuyerCatalogProductCard): string {
  return `${item.cartRole} rolü için seçildi; ${product.deliveryLabel.toLowerCase()} ve ${item.confidenceScore}/100 güven skoru taşıyor.`;
}

function mapSuggestions(
  suggestions: BuyerProductSuggestion[],
  productById: Map<string, BuyerCatalogProductCard>,
): BuyerAgentSuggestion[] {
  return suggestions.map((suggestion) => ({
    product: productById.get(suggestion.productId),
    suggestion,
  }));
}
