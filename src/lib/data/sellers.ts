import { sellers } from "@/data/mock/sellers";
import type { Seller } from "@/types/commerce";

export function getSellers(): Seller[] {
  return sellers;
}

export function getSellerById(sellerId: string): Seller | undefined {
  return sellers.find((seller) => seller.id === sellerId);
}

export function getDefaultSeller(): Seller {
  return sellers[0];
}
