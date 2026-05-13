import { orders } from "@/data/mock/orders";
import type { Order, OrderStatus } from "@/types/commerce";

export function getOrders(): Order[] {
  return orders;
}

export function getOrderById(orderId: string): Order | undefined {
  return orders.find((order) => order.id === orderId);
}

export function getOrdersBySellerId(sellerId: string): Order[] {
  return orders.filter((order) => order.sellerId === sellerId);
}

export function getOrdersByBuyerId(buyerId: string): Order[] {
  return orders.filter((order) => order.buyerId === buyerId);
}

export function getOrdersByStatus(status: OrderStatus): Order[] {
  return orders.filter((order) => order.status === status);
}

export function getOrdersContainingProduct(productId: string): Order[] {
  return orders.filter((order) => order.items.some((item) => item.productId === productId));
}

export function getReturnedOrdersByProductId(productId: string): Order[] {
  return orders.filter((order) => order.returnedProductIds.includes(productId));
}
