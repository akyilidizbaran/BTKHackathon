import type { Product } from "@/types/commerce";

export function clampPriority(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function formatPercent(value: number): string {
  return `%${Math.round(value * 100)}`;
}

export function formatTry(value: number): string {
  return `${Math.round(value).toLocaleString("tr-TR")} TL`;
}

export function revenueImpact(product: Product): number {
  return Math.min(18, product.metrics.revenue30d / 18000);
}

export function demandImpact(product: Product): number {
  return Math.min(16, product.metrics.orders30d / 10);
}

export function visibilityImpact(product: Product): number {
  return Math.min(14, product.metrics.views30d / 360);
}

export function createActionId(prefix: string, productId: string): string {
  return `${prefix}-${productId.replace("prod-", "")}`;
}
