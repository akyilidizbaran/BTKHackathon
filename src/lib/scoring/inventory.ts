import type { Product } from "@/types/commerce";
import { clampScore, type ExplainableScore } from "./common";

export interface InventoryCoverageEvidence extends Record<string, unknown> {
  onHand: number;
  reserved: number;
  availableStock: number;
  reorderPoint: number;
  orders30d: number;
  averageDailyDemand: number;
  forecastDemand7d: number;
  projectedGap7d: number;
  coverageDays: number | null;
  restockLeadTimeDays: number;
}

export type InventoryCoverageScore = ExplainableScore<InventoryCoverageEvidence>;

export function scoreInventoryCoverage(product: Product): InventoryCoverageScore {
  const availableStock = Math.max(0, product.stock.onHand - product.stock.reserved);
  const averageDailyDemand = product.metrics.orders30d / 30;
  const forecastDemand7d = Math.ceil(averageDailyDemand * 7);
  const projectedGap7d = Math.max(0, forecastDemand7d - availableStock);
  const coverageDays =
    averageDailyDemand > 0 ? Math.floor(availableStock / averageDailyDemand) : null;
  const reorderPressure =
    product.stock.reorderPoint > 0
      ? Math.max(0, (product.stock.reorderPoint - availableStock) / product.stock.reorderPoint)
      : 0;
  const demandPressure =
    forecastDemand7d > 0 ? Math.max(0, (forecastDemand7d - availableStock) / forecastDemand7d) : 0;
  const leadTimePressure =
    coverageDays === null
      ? 0
      : product.stock.restockLeadTimeDays > 0
        ? Math.max(0, (product.stock.restockLeadTimeDays - coverageDays) / product.stock.restockLeadTimeDays)
        : 0;
  const score = clampScore(100 - (reorderPressure * 45 + demandPressure * 40 + leadTimePressure * 15));
  const drivers = [
    `Kullanılabilir stok: ${availableStock} adet`,
    `Son 30 gün siparişi: ${product.metrics.orders30d} adet`,
    `7 günlük tahmini talep: ${forecastDemand7d} adet`,
    `Yeniden sipariş eşiği: ${product.stock.reorderPoint} adet`,
  ];

  if (projectedGap7d > 0) {
    drivers.push(`Önümüzdeki 7 gün için yaklaşık ${projectedGap7d} adet stok açığı oluşabilir`);
  }

  if (coverageDays !== null) {
    drivers.push(`Mevcut stok satış hızına göre yaklaşık ${coverageDays} gün yeter`);
  }

  return {
    score,
    label: score >= 75 ? "Stok kapsaması güçlü" : "Stok kapsaması zayıf",
    summary:
      projectedGap7d > 0
        ? `${product.name} için 7 günlük tahmini talep ${forecastDemand7d} adet; kullanılabilir stok ${availableStock} adet olduğu için açık oluşabilir.`
        : `${product.name} için kullanılabilir stok 7 günlük tahmini talebi karşılıyor.`,
    drivers,
    evidence: {
      onHand: product.stock.onHand,
      reserved: product.stock.reserved,
      availableStock,
      reorderPoint: product.stock.reorderPoint,
      orders30d: product.metrics.orders30d,
      averageDailyDemand,
      forecastDemand7d,
      projectedGap7d,
      coverageDays,
      restockLeadTimeDays: product.stock.restockLeadTimeDays,
    },
    recommendedFocus:
      projectedGap7d > 0
        ? "Stok yenileme veya kampanya temposunu yavaşlatma aksiyonu değerlendirilmeli."
        : "Stok seviyesi izlenmeye devam edilmeli; ek büyüme aksiyonu için diğer sinyaller kontrol edilebilir.",
  };
}
