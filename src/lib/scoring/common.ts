export interface ExplainableScore<Evidence extends Record<string, unknown> = Record<string, unknown>> {
  score: number;
  label: string;
  summary: string;
  drivers: string[];
  evidence: Evidence;
  recommendedFocus: string;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function toPercent(value: number): number {
  return Math.round(value * 100);
}

export function formatTry(value: number): string {
  return `${Math.round(value).toLocaleString("tr-TR")} TL`;
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

export function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce(
    (counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    },
    {} as Record<T, number>,
  );
}

export function topEntries<T extends string>(counts: Record<T, number>, limit: number): T[] {
  return Object.entries(counts)
    .sort(([, firstCount], [, secondCount]) => Number(secondCount) - Number(firstCount))
    .slice(0, limit)
    .map(([key]) => key as T);
}
