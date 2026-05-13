import { buyers } from "@/data/mock/buyers";
import type { Buyer, BuyerSensitivity, ReviewTheme } from "@/types/commerce";

export function getBuyers(): Buyer[] {
  return buyers;
}

export function getBuyerById(buyerId: string): Buyer | undefined {
  return buyers.find((buyer) => buyer.id === buyerId);
}

export function getBuyersBySensitivity(sensitivity: BuyerSensitivity): Buyer[] {
  return buyers.filter((buyer) => buyer.sensitivities.includes(sensitivity));
}

export function getBuyersByPreviousComplaintTheme(theme: ReviewTheme): Buyer[] {
  return buyers.filter((buyer) => buyer.previousComplaintThemes.includes(theme));
}

export function getBuyersByPreferredColor(color: string): Buyer[] {
  const normalizedColor = color.toLocaleLowerCase("tr-TR");

  return buyers.filter((buyer) =>
    buyer.preferredColors.some((candidate) =>
      candidate.toLocaleLowerCase("tr-TR").includes(normalizedColor),
    ),
  );
}
