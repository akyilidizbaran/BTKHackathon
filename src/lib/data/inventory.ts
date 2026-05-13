import { inventoryEvents } from "@/data/mock/inventory-events";
import type { InventoryEvent, InventoryEventType } from "@/types/commerce";

export function getInventoryEvents(): InventoryEvent[] {
  return inventoryEvents;
}

export function getInventoryEventById(eventId: string): InventoryEvent | undefined {
  return inventoryEvents.find((event) => event.id === eventId);
}

export function getInventoryEventsByProductId(productId: string): InventoryEvent[] {
  return inventoryEvents.filter((event) => event.productId === productId);
}

export function getInventoryEventsByType(type: InventoryEventType): InventoryEvent[] {
  return inventoryEvents.filter((event) => event.type === type);
}

export function getInventoryEventsByProductIds(productIds: string[]): InventoryEvent[] {
  const productIdSet = new Set(productIds);

  return inventoryEvents.filter((event) => productIdSet.has(event.productId));
}
