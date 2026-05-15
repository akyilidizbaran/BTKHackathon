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
import type {
  BuyerCartWarning,
  BuyerProductSuggestion,
  BuyerSmartCartItem,
} from "@/lib/workflows";

export const buyerAgentEndpoint = "/api/buyer/agent";
export const buyerAgentApplyEndpoint = "/api/buyer/agent/apply";

export type BuyerAgentApplyStrategy = "append" | "replace";

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

export interface BuyerAgentApplyRequestItem {
  productId: string;
  quantity?: number;
}

export interface BuyerAgentApplyRequest {
  strategy: BuyerAgentApplyStrategy;
  items: BuyerAgentApplyRequestItem[];
}

export interface BuyerAgentApplyApiData {
  contract: {
    envelope: "success/data/error";
    source: "buyer-agent-cart-apply";
    generatedAt: string;
    endpoint: typeof buyerAgentApplyEndpoint;
    method: "POST";
  };
  strategy: BuyerAgentApplyStrategy;
  items: Array<{
    product: BuyerCatalogProductCard;
    productId: string;
    quantity: number;
  }>;
  summary: {
    itemCount: number;
    productCount: number;
    totalPrice: number;
  };
  message: string;
}

export interface BuyerAgentApplyValidationError {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export interface BuyerAgentApplyValidationSuccess {
  ok: true;
  value: BuyerAgentApplyRequest;
}

export type BuyerAgentApplyValidationResult =
  | BuyerAgentApplyValidationError
  | BuyerAgentApplyValidationSuccess;

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
    complementarySuggestions: mapSuggestions(sourceSmartCart.result.complementarySuggestions, productById),
    sourceSmartCart,
  };
}

export function validateBuyerAgentApplyRequest(rawInput: unknown): BuyerAgentApplyValidationResult {
  if (!isRecord(rawInput)) {
    return {
      ok: false,
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      status: 400,
    };
  }

  const strategy = rawInput.strategy;

  if (strategy !== "append" && strategy !== "replace") {
    return {
      ok: false,
      code: "INVALID_STRATEGY",
      message: "Sepet uygulama stratejisi append veya replace olmalı.",
      status: 400,
    };
  }

  if (!Array.isArray(rawInput.items) || rawInput.items.length === 0) {
    return {
      ok: false,
      code: "ITEMS_REQUIRED",
      message: "Sepete uygulanacak en az bir ürün olmalı.",
      status: 400,
    };
  }

  const items = rawInput.items
    .map((item) => normalizeApplyItem(item))
    .filter((item): item is BuyerAgentApplyRequestItem => Boolean(item));

  if (items.length === 0) {
    return {
      ok: false,
      code: "INVALID_ITEMS",
      message: "Ürün id ve adet bilgisi geçerli olmalı.",
      status: 400,
    };
  }

  return {
    ok: true,
    value: {
      items,
      strategy,
    },
  };
}

export function getBuyerAgentApplyApiData(request: BuyerAgentApplyRequest): BuyerAgentApplyApiData {
  const catalogProducts = getBuyerCatalogApiData().products;
  const productById = new Map(catalogProducts.map((product) => [product.id, product]));
  const mergedItems = mergeApplyItems(request.items)
    .map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        return undefined;
      }

      return {
        product,
        productId: item.productId,
        quantity: item.quantity ?? 1,
      };
    })
    .filter((item): item is BuyerAgentApplyApiData["items"][number] => Boolean(item));
  const itemCount = mergedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = mergedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return {
    contract: {
      envelope: "success/data/error",
      source: "buyer-agent-cart-apply",
      generatedAt: "2026-05-16",
      endpoint: buyerAgentApplyEndpoint,
      method: "POST",
    },
    strategy: request.strategy,
    items: mergedItems,
    summary: {
      itemCount,
      productCount: mergedItems.length,
      totalPrice: Math.round(totalPrice),
    },
    message:
      request.strategy === "replace"
        ? "Mevcut sepet önerilen seçkiyle değiştirilmeye hazır."
        : "Önerilen seçki mevcut sepete eklenmeye hazır.",
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

function mergeApplyItems(items: BuyerAgentApplyRequestItem[]): BuyerAgentApplyRequestItem[] {
  const quantityByProductId = new Map<string, number>();

  items.forEach((item) => {
    quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + clampQuantity(item.quantity ?? 1));
  });

  return Array.from(quantityByProductId, ([productId, quantity]) => ({
    productId,
    quantity: clampQuantity(quantity),
  }));
}

function normalizeApplyItem(value: unknown): BuyerAgentApplyRequestItem | undefined {
  if (!isRecord(value) || typeof value.productId !== "string" || !value.productId.trim()) {
    return undefined;
  }

  return {
    productId: value.productId.trim(),
    quantity: clampQuantity(Number(value.quantity ?? 1)),
  };
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.min(99, Math.max(1, Math.round(quantity)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
