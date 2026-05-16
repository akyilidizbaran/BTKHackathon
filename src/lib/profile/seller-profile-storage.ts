import type {
  SellerAgentCapabilityId,
  SellerAgentPermissionMode,
  SellerAlertThreshold,
  SellerNotificationChannelId,
  SellerProfileEditableState,
} from "@/lib/api/seller-profile";

export const sellerProfileStorageKey = "commercepilot.sellerProfile.v1";
export const sellerProfileUpdatedEvent = "commercepilot:seller-profile-updated";

const permissionModes = new Set<SellerAgentPermissionMode>([
  "approved-apply",
  "chat-only",
  "draft-only",
]);
const capabilityIds = new Set<SellerAgentCapabilityId>([
  "campaign-draft",
  "listing-draft",
  "price-suggestion",
  "product-analysis",
  "review-reply-draft",
  "stock-alert",
]);
const notificationChannelIds = new Set<SellerNotificationChannelId>([
  "email",
  "panel",
  "weekly-summary",
  "whatsapp",
]);
const alertThresholds = new Set<SellerAlertThreshold>([
  "critical",
  "high",
  "low",
  "medium",
]);

export function readSellerProfileDraft(sellerId: string): SellerProfileEditableState | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(sellerProfileStorageKey);

  if (!rawValue) {
    return undefined;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return undefined;
    }

    const draft = parsedValue as Partial<SellerProfileEditableState>;

    if (draft.sellerId !== sellerId || typeof draft.storeDisplayName !== "string") {
      return undefined;
    }

    return {
      alertRules: Array.isArray(draft.alertRules)
        ? draft.alertRules.map((rule) => ({
            ...rule,
            enabled: Boolean(rule.enabled),
            threshold: alertThresholds.has(rule.threshold as SellerAlertThreshold)
              ? rule.threshold
              : "medium",
          })) as SellerProfileEditableState["alertRules"]
        : [],
      defaultDeliveryPromiseDays: normalizeNumber(draft.defaultDeliveryPromiseDays, 3),
      enabledCapabilityIds: normalizeStringArray(draft.enabledCapabilityIds)
        .filter((id): id is SellerAgentCapabilityId => capabilityIds.has(id as SellerAgentCapabilityId)),
      notificationChannelIds: normalizeStringArray(draft.notificationChannelIds)
        .filter((id): id is SellerNotificationChannelId => notificationChannelIds.has(id as SellerNotificationChannelId)),
      permissionMode: permissionModes.has(draft.permissionMode as SellerAgentPermissionMode)
        ? (draft.permissionMode as SellerAgentPermissionMode)
        : "draft-only",
      proactiveControls: {
        disableOnProductPages: Boolean(draft.proactiveControls?.disableOnProductPages),
        floatingBadgeEnabled: draft.proactiveControls?.floatingBadgeEnabled !== false,
        hideFloatingAgent: Boolean(draft.proactiveControls?.hideFloatingAgent),
        muteAll: Boolean(draft.proactiveControls?.muteAll),
      },
      quietHours: {
        end: typeof draft.quietHours?.end === "string" ? draft.quietHours.end : "09:00",
        start: typeof draft.quietHours?.start === "string" ? draft.quietHours.start : "22:30",
      },
      returnWindowDays: normalizeNumber(draft.returnWindowDays, 14),
      sellerId,
      storeDisplayName: draft.storeDisplayName,
      supportResponseHours: normalizeNumber(draft.supportResponseHours, 4),
      updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

export function writeSellerProfileDraft(draft: SellerProfileEditableState): SellerProfileEditableState {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(sellerProfileStorageKey, JSON.stringify(draft));
    window.dispatchEvent(new CustomEvent(sellerProfileUpdatedEvent, { detail: draft }));
  }

  return draft;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeNumber(value: unknown, fallback: number): number {
  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? Math.round(numericValue) : fallback;
}
