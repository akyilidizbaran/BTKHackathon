import type { BuyerProfileEditableState } from "@/lib/api/buyer-profile";

export const buyerProfileStorageKey = "commercepilot.buyerProfile.v1";
export const buyerProfileUpdatedEvent = "commercepilot:buyer-profile-updated";

export function readBuyerProfileDraft(buyerId: string): BuyerProfileEditableState | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(buyerProfileStorageKey);

  if (!rawValue) {
    return undefined;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return undefined;
    }

    const draft = parsedValue as Partial<BuyerProfileEditableState>;

    if (draft.buyerId !== buyerId || typeof draft.personalNote !== "string") {
      return undefined;
    }

    return {
      budgetBand: draft.budgetBand === "ekonomik" || draft.budgetBand === "orta" || draft.budgetBand === "premium"
        ? draft.budgetBand
        : "orta",
      buyerId,
      personalNote: draft.personalNote,
      preferredColors: normalizeStringArray(draft.preferredColors),
      selectedPreferenceIds: normalizeStringArray(draft.selectedPreferenceIds) as BuyerProfileEditableState["selectedPreferenceIds"],
      updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

export function writeBuyerProfileDraft(draft: BuyerProfileEditableState): BuyerProfileEditableState {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(buyerProfileStorageKey, JSON.stringify(draft));
    window.dispatchEvent(new CustomEvent(buyerProfileUpdatedEvent, { detail: draft }));
  }

  return draft;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
