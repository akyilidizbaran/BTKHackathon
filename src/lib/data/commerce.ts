import type {
  Buyer,
  Cart,
  InventoryEvent,
  Order,
  Product,
  ProductRelation,
  RelationType,
  Review,
  Seller,
} from "@/types/commerce";
import { getBuyerById } from "./buyers";
import { getCartById, getCartsByBuyerId } from "./carts";
import { getInventoryEventsByProductId, getInventoryEventsByProductIds } from "./inventory";
import { getOrdersByBuyerId, getOrdersBySellerId, getOrdersContainingProduct } from "./orders";
import { getProductById, getProductsBySellerId } from "./products";
import {
  getOutgoingRelationsByProductId,
  getRelationsByProductId,
  getRelationsByProductIdAndType,
} from "./relations";
import { getReviewsByBuyerId, getReviewsByProductId } from "./reviews";
import { getSellerById } from "./sellers";

export interface ProductDetail {
  product: Product;
  reviews: Review[];
  relations: ProductRelation[];
  relatedProducts: Product[];
  inventoryEvents: InventoryEvent[];
  orders: Order[];
}

export interface SellerOverview {
  seller: Seller;
  products: Product[];
  reviews: Review[];
  orders: Order[];
  inventoryEvents: InventoryEvent[];
  relations: ProductRelation[];
}

export interface BuyerProfile {
  buyer: Buyer;
  reviews: Review[];
  orders: Order[];
  carts: Cart[];
}

export interface CartDetail {
  cart: Cart;
  buyer: Buyer | undefined;
  items: Array<{
    product: Product;
    quantity: number;
  }>;
  total: number;
}

export function getProductDetail(productId: string): ProductDetail | undefined {
  const product = getProductById(productId);

  if (!product) {
    return undefined;
  }

  const relations = getRelationsByProductId(productId);
  const relatedProducts = getRelatedProductsForRelations(productId, relations);

  return {
    product,
    reviews: getReviewsByProductId(productId),
    relations,
    relatedProducts,
    inventoryEvents: getInventoryEventsByProductId(productId),
    orders: getOrdersContainingProduct(productId),
  };
}

export function getSellerOverview(sellerId: string): SellerOverview | undefined {
  const seller = getSellerById(sellerId);

  if (!seller) {
    return undefined;
  }

  const products = getProductsBySellerId(sellerId);
  const productIds = products.map((product) => product.id);
  const productIdSet = new Set(productIds);
  const relations = productIds.flatMap((productId) => getOutgoingRelationsByProductId(productId));

  return {
    seller,
    products,
    reviews: products.flatMap((product) => getReviewsByProductId(product.id)),
    orders: getOrdersBySellerId(sellerId),
    inventoryEvents: getInventoryEventsByProductIds(productIds),
    relations: relations.filter((relation) => productIdSet.has(relation.relatedProductId)),
  };
}

export function getBuyerProfile(buyerId: string): BuyerProfile | undefined {
  const buyer = getBuyerById(buyerId);

  if (!buyer) {
    return undefined;
  }

  return {
    buyer,
    reviews: getReviewsByBuyerId(buyerId),
    orders: getOrdersByBuyerId(buyerId),
    carts: getCartsByBuyerId(buyerId),
  };
}

export function getCartDetail(cartId: string): CartDetail | undefined {
  const cart = getCartById(cartId);

  if (!cart) {
    return undefined;
  }

  const items = cart.items.flatMap((item) => {
    const product = getProductById(item.productId);

    if (!product) {
      return [];
    }

    return [{ product, quantity: item.quantity }];
  });

  return {
    cart,
    buyer: getBuyerById(cart.buyerId),
    items,
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  };
}

export function getRelatedProducts(productId: string, type?: RelationType): Product[] {
  const relations = type
    ? getRelationsByProductIdAndType(productId, type)
    : getRelationsByProductId(productId);

  return getRelatedProductsForRelations(productId, relations);
}

function getRelatedProductsForRelations(
  productId: string,
  relations: ProductRelation[],
): Product[] {
  return relations.flatMap((relation) => {
    const relatedProductId =
      relation.sourceProductId === productId ? relation.relatedProductId : relation.sourceProductId;
    const relatedProduct = getProductById(relatedProductId);

    return relatedProduct ? [relatedProduct] : [];
  });
}
