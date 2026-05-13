import type { Product } from "@/types/commerce";
import { clampScore, formatTry, toPercent, type ExplainableScore } from "./common";

export interface ProfitConfidenceEvidence extends Record<string, unknown> {
  price: number;
  unitCost: number;
  grossMargin: number;
  grossMarginRate: number;
  adSpend30d: number;
  adSpendToRevenueRate: number;
  returnRate: number;
  conversionRate: number;
}

export type ProfitConfidenceScore = ExplainableScore<ProfitConfidenceEvidence>;

export function scoreProfitConfidence(product: Product): ProfitConfidenceScore {
  const grossMargin = product.price - product.unitCost;
  const grossMarginRate = product.price > 0 ? grossMargin / product.price : 0;
  const adSpendToRevenueRate =
    product.metrics.revenue30d > 0 ? product.metrics.adSpend30d / product.metrics.revenue30d : 0;
  const marginComponent = Math.min(100, grossMarginRate * 220);
  const adPenalty = Math.min(30, adSpendToRevenueRate * 120);
  const returnPenalty = Math.min(25, product.metrics.returnRate * 120);
  const conversionBonus = Math.min(12, product.metrics.conversionRate * 180);
  const score = clampScore(marginComponent - adPenalty - returnPenalty + conversionBonus);
  const drivers = [
    `Birim satış fiyatı: ${formatTry(product.price)}`,
    `Tahmini birim maliyet: ${formatTry(product.unitCost)}`,
    `Brüt marj oranı: %${toPercent(grossMarginRate)}`,
    `Reklam harcaması / gelir oranı: %${toPercent(adSpendToRevenueRate)}`,
    `İade oranı: %${toPercent(product.metrics.returnRate)}`,
  ];

  return {
    score,
    label: score >= 75 ? "Kârlılık güveni güçlü" : "Kârlılık baskısı var",
    summary:
      score >= 75
        ? `${product.name} fiyat, maliyet ve reklam sinyalleriyle sağlıklı marj taşıyor.`
        : `${product.name} satış üretse bile maliyet, reklam veya iade baskısı nedeniyle kârlılık riski taşıyabilir.`,
    drivers,
    evidence: {
      price: product.price,
      unitCost: product.unitCost,
      grossMargin,
      grossMarginRate,
      adSpend30d: product.metrics.adSpend30d,
      adSpendToRevenueRate,
      returnRate: product.metrics.returnRate,
      conversionRate: product.metrics.conversionRate,
    },
    recommendedFocus:
      score >= 75
        ? "Kârlılık sinyali güçlü; kampanya veya bundle ile büyütme değerlendirilebilir."
        : "Fiyat, reklam verimi, iade azaltma veya listeleme iyileştirme birlikte ele alınmalı.",
  };
}
