"use client";

import {
  sellerListingMutationStorageKey,
  sellerListingMutationUpdatedEvent,
  type SellerListingMutationApplyApiData,
  type SellerListingMutationSurface,
  type SellerListingMutationValues,
} from "@/lib/agents/seller-listing-apply";

export interface SellerListingMutationAuditEntry {
  actorId?: string;
  after: SellerListingMutationValues;
  before: SellerListingMutationValues;
  createdAt: string;
  delta: SellerListingMutationApplyApiData["delta"];
  eventName: typeof sellerListingMutationUpdatedEvent;
  id: string;
  productHref: string;
  productId: string;
  productName: string;
  reason?: string;
  rollbackAvailable: boolean;
  rolledBackAt?: string;
  sourceRuntimeId?: string;
  status: "applied" | "rolled-back";
  surface: SellerListingMutationSurface;
  toolId: SellerListingMutationApplyApiData["sharedMutation"]["toolId"];
}

export interface SellerListingMutationStore {
  auditLog: SellerListingMutationAuditEntry[];
  overrides: Record<string, SellerListingMutationOverride>;
  version: 1;
}

export interface SellerListingMutationOverride extends SellerListingMutationValues {
  auditId: string;
  productId: string;
  updatedAt: string;
}

export interface SellerListingMutationApplyClientResult {
  auditId: string;
  eventName: typeof sellerListingMutationUpdatedEvent;
  fieldCount: number;
  message: string;
  productId: string;
  productName: string;
  rollbackAvailable: boolean;
  status: "applied";
  surface: SellerListingMutationSurface;
  toolId: SellerListingMutationApplyApiData["sharedMutation"]["toolId"];
}

export interface SellerListingMutationRollbackResult {
  auditId: string;
  eventName: typeof sellerListingMutationUpdatedEvent;
  message: string;
  ok: boolean;
  productId?: string;
  productName?: string;
  status?: "rolled-back";
}

export function readSellerListingMutationStore(): SellerListingMutationStore {
  if (typeof window === "undefined") {
    return createEmptyStore();
  }

  const rawValue = window.localStorage.getItem(sellerListingMutationStorageKey);

  if (!rawValue) {
    return createEmptyStore();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<SellerListingMutationStore>;

    if (!parsedValue || typeof parsedValue !== "object" || !Array.isArray(parsedValue.auditLog)) {
      return createEmptyStore();
    }

    return {
      auditLog: parsedValue.auditLog.filter(isAuditEntry).slice(0, 30),
      overrides: normalizeOverrides(parsedValue.overrides),
      version: 1,
    };
  } catch {
    return createEmptyStore();
  }
}

export function applySellerListingMutation(
  data: SellerListingMutationApplyApiData,
  options: { surface?: SellerListingMutationSurface } = {},
): SellerListingMutationApplyClientResult {
  const store = readSellerListingMutationStore();
  const surface = options.surface ?? data.sharedMutation.surface ?? "route";
  const createdAt = data.contract.generatedAt;
  const entry: SellerListingMutationAuditEntry = {
    actorId: data.sharedMutation.actorId,
    after: data.after,
    before: data.before,
    createdAt,
    delta: data.delta,
    eventName: data.sharedMutation.clientAction.eventName,
    id: data.auditPreview.id,
    productHref: data.product.href,
    productId: data.product.id,
    productName: data.product.name,
    rollbackAvailable: data.auditPreview.rollbackAvailable,
    sourceRuntimeId: data.sharedMutation.sourceRuntimeId,
    status: "applied",
    surface,
    toolId: data.sharedMutation.toolId,
  };

  const nextStore: SellerListingMutationStore = {
    auditLog: [entry, ...store.auditLog.filter((item) => item.id !== entry.id)].slice(0, 30),
    overrides: {
      ...store.overrides,
      [data.product.id]: {
        ...data.after,
        auditId: entry.id,
        productId: data.product.id,
        updatedAt: createdAt,
      },
    },
    version: 1,
  };

  writeSellerListingMutationStore(nextStore);

  return {
    auditId: entry.id,
    eventName: entry.eventName,
    fieldCount: data.summary.fieldCount,
    message: `${data.product.name} için listeleme değişikliği uygulandı.`,
    productId: data.product.id,
    productName: data.product.name,
    rollbackAvailable: true,
    status: "applied",
    surface,
    toolId: entry.toolId,
  };
}

export function rollbackSellerListingMutation(auditId: string): SellerListingMutationRollbackResult {
  const store = readSellerListingMutationStore();
  const target = store.auditLog.find((entry) => entry.id === auditId);

  if (!target) {
    return {
      auditId,
      eventName: sellerListingMutationUpdatedEvent,
      message: "Geri alınacak işlem kaydı bulunamadı.",
      ok: false,
    };
  }

  if (target.status === "rolled-back") {
    return {
      auditId,
      eventName: sellerListingMutationUpdatedEvent,
      message: "Bu değişiklik zaten geri alınmış.",
      ok: false,
      productId: target.productId,
      productName: target.productName,
    };
  }

  const rolledBackAt = new Date().toISOString();
  const auditLog = store.auditLog.map((entry) => (
    entry.id === auditId
      ? {
          ...entry,
          rolledBackAt,
          status: "rolled-back" as const,
        }
      : entry
  ));
  const previousAppliedEntry = auditLog.find((entry) => (
    entry.productId === target.productId &&
    entry.id !== auditId &&
    entry.status === "applied"
  ));
  const overrides = { ...store.overrides };

  if (previousAppliedEntry) {
    overrides[target.productId] = {
      ...previousAppliedEntry.after,
      auditId: previousAppliedEntry.id,
      productId: target.productId,
      updatedAt: previousAppliedEntry.createdAt,
    };
  } else {
    delete overrides[target.productId];
  }

  writeSellerListingMutationStore({
    auditLog,
    overrides,
    version: 1,
  });

  return {
    auditId,
    eventName: sellerListingMutationUpdatedEvent,
    message: `${target.productName} listeleme değişikliği geri alındı.`,
    ok: true,
    productId: target.productId,
    productName: target.productName,
    status: "rolled-back",
  };
}

function writeSellerListingMutationStore(store: SellerListingMutationStore): SellerListingMutationStore {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(sellerListingMutationStorageKey, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(sellerListingMutationUpdatedEvent, { detail: store }));
  }

  return store;
}

function createEmptyStore(): SellerListingMutationStore {
  return {
    auditLog: [],
    overrides: {},
    version: 1,
  };
}

function normalizeOverrides(value: unknown): Record<string, SellerListingMutationOverride> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, SellerListingMutationOverride] => isOverride(entry[1])),
  );
}

function isAuditEntry(value: unknown): value is SellerListingMutationAuditEntry {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as SellerListingMutationAuditEntry).id === "string" &&
      typeof (value as SellerListingMutationAuditEntry).productId === "string" &&
      typeof (value as SellerListingMutationAuditEntry).productName === "string" &&
      ((value as SellerListingMutationAuditEntry).status === "applied" ||
        (value as SellerListingMutationAuditEntry).status === "rolled-back"),
  );
}

function isOverride(value: unknown): value is SellerListingMutationOverride {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as SellerListingMutationOverride).auditId === "string" &&
      typeof (value as SellerListingMutationOverride).productId === "string" &&
      typeof (value as SellerListingMutationOverride).title === "string" &&
      typeof (value as SellerListingMutationOverride).description === "string" &&
      typeof (value as SellerListingMutationOverride).campaignLabel === "string" &&
      typeof (value as SellerListingMutationOverride).price === "number",
  );
}
