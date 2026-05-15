export const buyerCartStorageKey = "commercepilot.buyerCart.v1";
export const buyerCartUpdatedEvent = "commercepilot:buyer-cart-updated";

export interface BuyerCartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export function readBuyerCartItems(): BuyerCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(buyerCartStorageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((item) => normalizeCartItem(item))
      .filter((item): item is BuyerCartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function addBuyerCartItem(productId: string, quantity = 1): BuyerCartItem[] {
  const items = readBuyerCartItems();
  const existingItem = items.find((item) => item.productId === productId);
  const safeQuantity = clampQuantity(quantity);

  if (existingItem) {
    existingItem.quantity = clampQuantity(existingItem.quantity + safeQuantity);
  } else {
    items.push({
      addedAt: new Date().toISOString(),
      productId,
      quantity: safeQuantity,
    });
  }

  return writeBuyerCartItems(items);
}

export function setBuyerCartItemQuantity(productId: string, quantity: number): BuyerCartItem[] {
  if (quantity <= 0) {
    return removeBuyerCartItem(productId);
  }

  const items = readBuyerCartItems().map((item) =>
    item.productId === productId
      ? {
          ...item,
          quantity: clampQuantity(quantity),
        }
      : item,
  );

  return writeBuyerCartItems(items);
}

export function removeBuyerCartItem(productId: string): BuyerCartItem[] {
  return writeBuyerCartItems(readBuyerCartItems().filter((item) => item.productId !== productId));
}

export function clearBuyerCartItems(): BuyerCartItem[] {
  return writeBuyerCartItems([]);
}

function writeBuyerCartItems(items: BuyerCartItem[]): BuyerCartItem[] {
  const normalizedItems = items
    .map((item) => normalizeCartItem(item))
    .filter((item): item is BuyerCartItem => Boolean(item));

  if (typeof window !== "undefined") {
    window.localStorage.setItem(buyerCartStorageKey, JSON.stringify(normalizedItems));
    window.dispatchEvent(new CustomEvent(buyerCartUpdatedEvent, { detail: normalizedItems }));
  }

  return normalizedItems;
}

function normalizeCartItem(value: unknown): BuyerCartItem | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const item = value as Partial<BuyerCartItem>;

  if (!item.productId || typeof item.productId !== "string") {
    return undefined;
  }

  return {
    addedAt: typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString(),
    productId: item.productId,
    quantity: clampQuantity(Number(item.quantity)),
  };
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.min(99, Math.max(1, Math.round(quantity)));
}
