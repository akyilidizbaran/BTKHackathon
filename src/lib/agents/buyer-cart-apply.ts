import {
  getBuyerCatalogApiData,
  type BuyerCatalogProductCard,
} from "@/lib/api/buyer-catalog";
import {
  buyerCartStorageKey,
  buyerCartUpdatedEvent,
} from "@/lib/cart/buyer-cart";

export const buyerAgentApplyEndpoint = "/api/buyer/agent/apply";
export const buyerAgentCartApplyToolId = "buyer.agent.cart.apply.preview";

export type BuyerAgentApplyStrategy = "append" | "replace";
export type BuyerAgentCartApplySurface = "floating" | "route";

export interface BuyerAgentApplyRequestItem {
  productId: string;
  quantity?: number;
}

export interface BuyerAgentApplyRequest {
  strategy: BuyerAgentApplyStrategy;
  items: BuyerAgentApplyRequestItem[];
  actorId?: string;
  sourceRuntimeId?: string;
  surface?: BuyerAgentCartApplySurface;
}

export interface BuyerAgentApplyPreview {
  endpoint: typeof buyerAgentApplyEndpoint;
  toolId: typeof buyerAgentCartApplyToolId;
  requiresApproval: true;
  items: BuyerAgentApplyRequestItem[];
  strategies: BuyerAgentApplyStrategyOption[];
  sharedSurfaces: BuyerAgentCartApplySurface[];
  stateTarget: BuyerAgentCartStateTarget;
  guardrails: string[];
  summary: {
    defaultStrategy: BuyerAgentApplyStrategy;
    itemCount: number;
    productCount: number;
  };
}

export interface BuyerAgentApplyStrategyOption {
  description: string;
  label: string;
  strategy: BuyerAgentApplyStrategy;
  tone: "primary" | "secondary";
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
  sharedMutation: BuyerAgentCartMutationContract;
}

export interface BuyerAgentCartMutationContract {
  actorId?: string;
  confirmationCopy: string;
  endpoint: typeof buyerAgentApplyEndpoint;
  requiresApproval: true;
  sharedSurfaces: BuyerAgentCartApplySurface[];
  sourceRuntimeId?: string;
  stateTarget: BuyerAgentCartStateTarget;
  strategy: BuyerAgentApplyStrategy;
  strategyLabel: string;
  toolId: typeof buyerAgentCartApplyToolId;
  clientAction: {
    eventName: typeof buyerCartUpdatedEvent;
    helper: "applyBuyerAgentCartMutation";
    writeMode: "client-localStorage";
  };
  handoff: {
    cartHref: "/buyer/cart";
    floatingAgentMilestone: "8Q";
    routeAgent: "/buyer/agent";
  };
}

export interface BuyerAgentCartStateTarget {
  helperModule: "src/lib/cart/buyer-cart.ts";
  kind: "client-localStorage";
  storageKey: typeof buyerCartStorageKey;
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

const sharedSurfaces: BuyerAgentCartApplySurface[] = ["route", "floating"];

export function validateBuyerAgentApplyRequest(rawInput: unknown): BuyerAgentApplyValidationResult {
  if (!isRecord(rawInput)) {
    return {
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      ok: false,
      status: 400,
    };
  }

  const strategy = rawInput.strategy;

  if (strategy !== "append" && strategy !== "replace") {
    return {
      code: "INVALID_STRATEGY",
      message: "Sepet uygulama stratejisi append veya replace olmalı.",
      ok: false,
      status: 400,
    };
  }

  if (!Array.isArray(rawInput.items) || rawInput.items.length === 0) {
    return {
      code: "ITEMS_REQUIRED",
      message: "Sepete uygulanacak en az bir ürün olmalı.",
      ok: false,
      status: 400,
    };
  }

  const items = rawInput.items
    .map((item) => normalizeBuyerAgentApplyItem(item))
    .filter((item): item is BuyerAgentApplyRequestItem => Boolean(item));

  if (items.length === 0) {
    return {
      code: "INVALID_ITEMS",
      message: "Ürün id ve adet bilgisi geçerli olmalı.",
      ok: false,
      status: 400,
    };
  }

  return {
    ok: true,
    value: {
      actorId: typeof rawInput.actorId === "string" && rawInput.actorId.trim() ? rawInput.actorId.trim() : undefined,
      items,
      sourceRuntimeId:
        typeof rawInput.sourceRuntimeId === "string" && rawInput.sourceRuntimeId.trim()
          ? rawInput.sourceRuntimeId.trim()
          : undefined,
      strategy,
      surface: normalizeApplySurface(rawInput.surface),
    },
  };
}

export function getBuyerAgentApplyApiData(request: BuyerAgentApplyRequest): BuyerAgentApplyApiData {
  const catalogProducts = getBuyerCatalogApiData().products;
  const productById = new Map(catalogProducts.map((product) => [product.id, product]));
  const mergedItems = mergeBuyerAgentApplyItems(request.items)
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
      endpoint: buyerAgentApplyEndpoint,
      envelope: "success/data/error",
      generatedAt: "2026-05-16",
      method: "POST",
      source: "buyer-agent-cart-apply",
    },
    items: mergedItems,
    message: createApplyMessage(request.strategy),
    sharedMutation: createBuyerAgentCartMutationContract(request),
    strategy: request.strategy,
    summary: {
      itemCount,
      productCount: mergedItems.length,
      totalPrice: Math.round(totalPrice),
    },
  };
}

export function createBuyerAgentApplyPreview(input: {
  items: BuyerAgentApplyRequestItem[];
}): BuyerAgentApplyPreview {
  const items = mergeBuyerAgentApplyItems(input.items);
  const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  return {
    endpoint: buyerAgentApplyEndpoint,
    guardrails: [
      "Kullanıcı onayı olmadan cart state yazılmaz.",
      "Route Agent ve Pet Panel aynı endpoint ve client helper ile uygular.",
      "Replace stratejisi mevcut sepeti önce temizler, append mevcut sepete ekler.",
    ],
    items,
    requiresApproval: true,
    sharedSurfaces,
    stateTarget: createStateTarget(),
    strategies: [
      {
        description: "Mevcut sepeti korur ve önerilen ürünleri üstüne ekler.",
        label: "Sepete ekle",
        strategy: "append",
        tone: "primary",
      },
      {
        description: "Mevcut sepeti temizler ve yalnızca Agent seçkisini bırakır.",
        label: "Sepeti değiştir",
        strategy: "replace",
        tone: "secondary",
      },
    ],
    summary: {
      defaultStrategy: "append",
      itemCount,
      productCount: items.length,
    },
    toolId: buyerAgentCartApplyToolId,
  };
}

export function mergeBuyerAgentApplyItems(items: BuyerAgentApplyRequestItem[]): BuyerAgentApplyRequestItem[] {
  const quantityByProductId = new Map<string, number>();

  items.forEach((item) => {
    quantityByProductId.set(
      item.productId,
      (quantityByProductId.get(item.productId) ?? 0) + clampApplyQuantity(item.quantity ?? 1),
    );
  });

  return Array.from(quantityByProductId, ([productId, quantity]) => ({
    productId,
    quantity: clampApplyQuantity(quantity),
  }));
}

function createBuyerAgentCartMutationContract(request: BuyerAgentApplyRequest): BuyerAgentCartMutationContract {
  return {
    actorId: request.actorId,
    clientAction: {
      eventName: buyerCartUpdatedEvent,
      helper: "applyBuyerAgentCartMutation",
      writeMode: "client-localStorage",
    },
    confirmationCopy:
      request.strategy === "replace"
        ? "Sepeti Agent seçkisiyle değiştirmek için kullanıcı onayı gerekir."
        : "Agent seçkisini mevcut sepete eklemek için kullanıcı onayı gerekir.",
    endpoint: buyerAgentApplyEndpoint,
    handoff: {
      cartHref: "/buyer/cart",
      floatingAgentMilestone: "8Q",
      routeAgent: "/buyer/agent",
    },
    requiresApproval: true,
    sharedSurfaces,
    sourceRuntimeId: request.sourceRuntimeId,
    stateTarget: createStateTarget(),
    strategy: request.strategy,
    strategyLabel: request.strategy === "replace" ? "Sepeti değiştir" : "Sepete ekle",
    toolId: buyerAgentCartApplyToolId,
  };
}

function createStateTarget(): BuyerAgentCartStateTarget {
  return {
    helperModule: "src/lib/cart/buyer-cart.ts",
    kind: "client-localStorage",
    storageKey: buyerCartStorageKey,
  };
}

function createApplyMessage(strategy: BuyerAgentApplyStrategy): string {
  return strategy === "replace"
    ? "Mevcut sepet önerilen seçkiyle değiştirilmeye hazır."
    : "Önerilen seçki mevcut sepete eklenmeye hazır.";
}

function normalizeBuyerAgentApplyItem(value: unknown): BuyerAgentApplyRequestItem | undefined {
  if (!isRecord(value) || typeof value.productId !== "string" || !value.productId.trim()) {
    return undefined;
  }

  return {
    productId: value.productId.trim(),
    quantity: clampApplyQuantity(Number(value.quantity ?? 1)),
  };
}

function normalizeApplySurface(value: unknown): BuyerAgentCartApplySurface | undefined {
  return value === "floating" || value === "route" ? value : undefined;
}

function clampApplyQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.min(99, Math.max(1, Math.round(quantity)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
