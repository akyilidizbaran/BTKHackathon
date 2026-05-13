import { carts } from "@/data/mock/carts";
import type { Cart } from "@/types/commerce";

export function getCarts(): Cart[] {
  return carts;
}

export function getCartById(cartId: string): Cart | undefined {
  return carts.find((cart) => cart.id === cartId);
}

export function getCartsByBuyerId(buyerId: string): Cart[] {
  return carts.filter((cart) => cart.buyerId === buyerId);
}

export function getRecommendedCarts(): Cart[] {
  return carts.filter((cart) => cart.status === "recommended");
}
