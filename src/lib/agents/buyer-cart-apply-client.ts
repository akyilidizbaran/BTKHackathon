"use client";

import {
  addBuyerCartItem,
  clearBuyerCartItems,
  readBuyerCartItems,
} from "@/lib/cart/buyer-cart";
import type {
  BuyerAgentApplyApiData,
  BuyerAgentCartApplySurface,
} from "@/lib/agents/buyer-cart-apply";

export interface BuyerAgentCartApplyClientResult {
  cartItemCount: number;
  itemCount: number;
  message: string;
  productCount: number;
  storageEvent: string;
  strategy: BuyerAgentApplyApiData["strategy"];
  strategyLabel: string;
  surface: BuyerAgentCartApplySurface;
  toolId: BuyerAgentApplyApiData["sharedMutation"]["toolId"];
}

export function applyBuyerAgentCartMutation(
  data: BuyerAgentApplyApiData,
  options: { surface?: BuyerAgentCartApplySurface } = {},
): BuyerAgentCartApplyClientResult {
  if (data.strategy === "replace") {
    clearBuyerCartItems();
  }

  data.items.forEach((item) => {
    addBuyerCartItem(item.productId, item.quantity);
  });

  const cartItemCount = readBuyerCartItems().reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItemCount,
    itemCount: data.summary.itemCount,
    message: data.strategy === "replace" ? "Sepet Agent seçkisiyle değiştirildi." : "Agent seçkisi sepete eklendi.",
    productCount: data.summary.productCount,
    storageEvent: data.sharedMutation.clientAction.eventName,
    strategy: data.strategy,
    strategyLabel: data.sharedMutation.strategyLabel,
    surface: options.surface ?? "route",
    toolId: data.sharedMutation.toolId,
  };
}
