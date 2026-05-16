import {
  demoSellerId,
  getSellerProductsApiData,
  type SellerProductApiRow,
} from "@/lib/api/seller";

export const sellerAgentApplyEndpoint = "/api/seller/agent/apply";
export const sellerAgentListingApplyToolId = "seller.agent.listing.apply";
export const sellerListingMutationStorageKey = "commercepilot.sellerListingMutations.v1";
export const sellerListingMutationUpdatedEvent = "commercepilot:seller-listing-mutation-updated";

export type SellerListingMutationSurface = "floating" | "route";
export type SellerListingMutationField = "campaignLabel" | "description" | "price" | "title";

export interface SellerListingMutationValues {
  campaignLabel: string;
  description: string;
  price: number;
  title: string;
}

export interface SellerListingMutationDelta {
  after: string;
  before: string;
  field: SellerListingMutationField;
  label: string;
}

export interface SellerListingMutationApplyRequest {
  actionId?: string;
  actorId?: string;
  before?: Partial<SellerListingMutationValues>;
  focusLabel?: string;
  mutation: SellerListingMutationValues;
  productId: string;
  reason?: string;
  sellerId?: string;
  sourceRuntimeId?: string;
  surface?: SellerListingMutationSurface;
}

export interface SellerListingMutationPreview {
  applyRequest: SellerListingMutationApplyRequest;
  approvalCopy: string;
  beforeListing: SellerListingMutationValues;
  afterListing: SellerListingMutationValues;
  delta: SellerListingMutationDelta[];
  endpoint: typeof sellerAgentApplyEndpoint;
  focusLabel: string;
  generatedAt: string;
  guardrails: string[];
  helper: string;
  productHref: string;
  productId: string;
  productName: string;
  requiresApproval: true;
  rollbackSupported: true;
  sharedSurfaces: SellerListingMutationSurface[];
  stateTarget: SellerListingMutationStateTarget;
  summary: {
    campaignLabel: string;
    fieldCount: number;
    mutationLabel: string;
    priceDelta: number;
  };
  toolId: typeof sellerAgentListingApplyToolId;
}

export interface SellerListingMutationApplyApiData {
  auditPreview: SellerListingMutationAuditPreview;
  before: SellerListingMutationValues;
  after: SellerListingMutationValues;
  contract: {
    endpoint: typeof sellerAgentApplyEndpoint;
    envelope: "success/data/error";
    generatedAt: string;
    method: "POST";
    source: "seller-agent-listing-apply";
  };
  delta: SellerListingMutationDelta[];
  message: string;
  product: {
    href: string;
    id: string;
    name: string;
    sku: string;
  };
  sharedMutation: SellerListingMutationContract;
  summary: {
    campaignLabel: string;
    fieldCount: number;
    priceDelta: number;
  };
}

export interface SellerListingMutationAuditPreview {
  actorId?: string;
  id: string;
  productId: string;
  productName: string;
  rollbackAvailable: true;
  status: "applied";
  storageEvent: typeof sellerListingMutationUpdatedEvent;
}

export interface SellerListingMutationContract {
  actorId?: string;
  clientAction: {
    eventName: typeof sellerListingMutationUpdatedEvent;
    helper: "applySellerListingMutation";
    rollbackHelper: "rollbackSellerListingMutation";
    writeMode: "client-localStorage";
  };
  confirmationCopy: string;
  endpoint: typeof sellerAgentApplyEndpoint;
  requiresApproval: true;
  rollback: {
    available: true;
    label: "Geri al";
  };
  sharedSurfaces: SellerListingMutationSurface[];
  sourceRuntimeId?: string;
  stateTarget: SellerListingMutationStateTarget;
  surface?: SellerListingMutationSurface;
  toolId: typeof sellerAgentListingApplyToolId;
}

export interface SellerListingMutationStateTarget {
  helperModule: "src/lib/agents/seller-listing-apply-client.ts";
  kind: "client-localStorage";
  storageKey: typeof sellerListingMutationStorageKey;
}

export interface SellerListingMutationApplyValidationError {
  code: string;
  message: string;
  ok: false;
  status: number;
}

export interface SellerListingMutationApplyValidationSuccess {
  ok: true;
  value: SellerListingMutationApplyRequest;
}

export type SellerListingMutationApplyValidationResult =
  | SellerListingMutationApplyValidationError
  | SellerListingMutationApplyValidationSuccess;

const sharedSurfaces: SellerListingMutationSurface[] = ["route", "floating"];

export function createSellerListingMutationPreview(input: {
  actionId?: string;
  actionTitle?: string;
  focusLabel: string;
  product: SellerProductApiRow;
  sellerId?: string;
  sourceRuntimeId?: string;
}): SellerListingMutationPreview {
  const beforeListing = createBeforeListing(input.product);
  const afterListing = createAfterListing(input.product, input.focusLabel, input.actionTitle);
  const delta = createDelta(beforeListing, afterListing);
  const priceDelta = afterListing.price - beforeListing.price;

  return {
    afterListing,
    applyRequest: {
      actionId: input.actionId,
      before: beforeListing,
      focusLabel: input.focusLabel,
      mutation: afterListing,
      productId: input.product.id,
      reason: input.actionTitle ?? `${input.focusLabel} için Agent listing taslağı`,
      sellerId: input.sellerId ?? demoSellerId,
      sourceRuntimeId: input.sourceRuntimeId,
      surface: "route",
    },
    approvalCopy: "Bu taslak yalnızca satıcı onayından sonra mock listing state'e yazılır.",
    beforeListing,
    delta,
    endpoint: sellerAgentApplyEndpoint,
    focusLabel: input.focusLabel,
    generatedAt: "2026-05-16",
    guardrails: [
      "Onay verilmeden client state yazılmaz.",
      "Apply route yalnızca doğrulanmış mutation contract'ı döndürür.",
      "Route Agent ve floating Agent aynı helper, storage key ve audit event'i paylaşır.",
    ],
    helper: input.actionTitle
      ? `${input.actionTitle} aksiyonuna bağlı before/after listing taslağı.`
      : `${input.focusLabel} sinyaline bağlı before/after listing taslağı.`,
    productHref: input.product.href,
    productId: input.product.id,
    productName: input.product.name,
    requiresApproval: true,
    rollbackSupported: true,
    sharedSurfaces,
    stateTarget: createStateTarget(),
    summary: {
      campaignLabel: afterListing.campaignLabel,
      fieldCount: delta.length,
      mutationLabel: `${delta.length} alan onay sonrası güncellenecek`,
      priceDelta,
    },
    toolId: sellerAgentListingApplyToolId,
  };
}

export function validateSellerListingMutationApplyRequest(
  rawInput: unknown,
): SellerListingMutationApplyValidationResult {
  if (!isRecord(rawInput)) {
    return {
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      ok: false,
      status: 400,
    };
  }

  const productId = typeof rawInput.productId === "string" ? rawInput.productId.trim() : "";

  if (!productId) {
    return {
      code: "PRODUCT_REQUIRED",
      message: "Uygulanacak listing için productId gerekli.",
      ok: false,
      status: 400,
    };
  }

  if (!isRecord(rawInput.mutation)) {
    return {
      code: "MUTATION_REQUIRED",
      message: "Listing mutation alanları gerekli.",
      ok: false,
      status: 400,
    };
  }

  const mutation = normalizeListingValues(rawInput.mutation);

  if (!mutation) {
    return {
      code: "INVALID_MUTATION",
      message: "Başlık, açıklama, fiyat ve kampanya etiketi geçerli olmalı.",
      ok: false,
      status: 400,
    };
  }

  const before = isRecord(rawInput.before) ? normalizePartialListingValues(rawInput.before) : undefined;

  return {
    ok: true,
    value: {
      actionId: normalizeString(rawInput.actionId),
      actorId: normalizeString(rawInput.actorId),
      before,
      focusLabel: normalizeString(rawInput.focusLabel),
      mutation,
      productId,
      reason: normalizeString(rawInput.reason),
      sellerId: normalizeString(rawInput.sellerId) ?? demoSellerId,
      sourceRuntimeId: normalizeString(rawInput.sourceRuntimeId),
      surface: normalizeSurface(rawInput.surface),
    },
  };
}

export function getSellerListingMutationApplyApiData(
  request: SellerListingMutationApplyRequest,
): SellerListingMutationApplyApiData | undefined {
  const product = resolveSellerListingMutationProduct(request.productId, request.sellerId);

  if (!product) {
    return undefined;
  }

  const before = {
    ...createBeforeListing(product),
    ...request.before,
  };
  const after = request.mutation;
  const delta = createDelta(before, after);
  const generatedAt = new Date().toISOString();
  const auditId = createAuditId(product.id, generatedAt);

  return {
    after,
    auditPreview: {
      actorId: request.actorId,
      id: auditId,
      productId: product.id,
      productName: product.name,
      rollbackAvailable: true,
      status: "applied",
      storageEvent: sellerListingMutationUpdatedEvent,
    },
    before,
    contract: {
      endpoint: sellerAgentApplyEndpoint,
      envelope: "success/data/error",
      generatedAt,
      method: "POST",
      source: "seller-agent-listing-apply",
    },
    delta,
    message: `${product.name} listing taslağı onay sonrası uygulanmaya hazır.`,
    product: {
      href: product.href,
      id: product.id,
      name: product.name,
      sku: product.sku,
    },
    sharedMutation: createSellerListingMutationContract(request),
    summary: {
      campaignLabel: after.campaignLabel,
      fieldCount: delta.length,
      priceDelta: after.price - before.price,
    },
  };
}

export function resolveSellerListingMutationProduct(
  productId: string,
  sellerId = demoSellerId,
): SellerProductApiRow | undefined {
  return getSellerProductsApiData(sellerId)?.products.find((product) => product.id === productId);
}

function createBeforeListing(product: SellerProductApiRow): SellerListingMutationValues {
  return {
    campaignLabel: product.linkedAction?.title ?? "Kampanya yok",
    description: `${product.healthLabel}. ${product.riskSignals[0]?.helper ?? "Risk sinyali izleniyor."}`,
    price: product.price,
    title: product.name,
  };
}

function createAfterListing(
  product: SellerProductApiRow,
  focusLabel: string,
  actionTitle?: string,
): SellerListingMutationValues {
  const price = Math.max(1, Math.round(product.price * getPriceMultiplier(focusLabel)));
  const riskHelper = product.riskSignals[0]?.helper ?? "ürün sinyali";

  return {
    campaignLabel: createCampaignLabel(focusLabel),
    description: `${focusLabel} sinyali açıklandı: ${riskHelper} Satıcı aksiyonu: ${actionTitle ?? "listing metni ve kampanya netleştirme"}.`,
    price,
    title: `${product.name} | ${createTitleSuffix(focusLabel)}`,
  };
}

function createSellerListingMutationContract(
  request: SellerListingMutationApplyRequest,
): SellerListingMutationContract {
  return {
    actorId: request.actorId,
    clientAction: {
      eventName: sellerListingMutationUpdatedEvent,
      helper: "applySellerListingMutation",
      rollbackHelper: "rollbackSellerListingMutation",
      writeMode: "client-localStorage",
    },
    confirmationCopy: "Listing başlığı, açıklaması, fiyatı ve kampanya etiketi satıcı onayıyla güncellenir.",
    endpoint: sellerAgentApplyEndpoint,
    requiresApproval: true,
    rollback: {
      available: true,
      label: "Geri al",
    },
    sharedSurfaces,
    sourceRuntimeId: request.sourceRuntimeId,
    stateTarget: createStateTarget(),
    surface: request.surface,
    toolId: sellerAgentListingApplyToolId,
  };
}

function createDelta(
  before: SellerListingMutationValues,
  after: SellerListingMutationValues,
): SellerListingMutationDelta[] {
  const fields: Array<{ field: SellerListingMutationField; label: string }> = [
    { field: "title", label: "Başlık" },
    { field: "description", label: "Açıklama" },
    { field: "price", label: "Fiyat" },
    { field: "campaignLabel", label: "Kampanya" },
  ];

  return fields
    .filter(({ field }) => before[field] !== after[field])
    .map(({ field, label }) => ({
      after: stringifyListingValue(after[field]),
      before: stringifyListingValue(before[field]),
      field,
      label,
    }));
}

function createStateTarget(): SellerListingMutationStateTarget {
  return {
    helperModule: "src/lib/agents/seller-listing-apply-client.ts",
    kind: "client-localStorage",
    storageKey: sellerListingMutationStorageKey,
  };
}

function normalizeListingValues(value: Record<string, unknown>): SellerListingMutationValues | undefined {
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const campaignLabel = typeof value.campaignLabel === "string" ? value.campaignLabel.trim() : "";
  const price = Number(value.price);

  if (
    title.length < 3 ||
    title.length > 140 ||
    description.length < 12 ||
    description.length > 420 ||
    campaignLabel.length < 3 ||
    campaignLabel.length > 100 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return undefined;
  }

  return {
    campaignLabel,
    description,
    price: Math.round(price),
    title,
  };
}

function normalizePartialListingValues(value: Record<string, unknown>): Partial<SellerListingMutationValues> {
  const normalized: Partial<SellerListingMutationValues> = {};

  if (typeof value.title === "string" && value.title.trim()) {
    normalized.title = value.title.trim();
  }

  if (typeof value.description === "string" && value.description.trim()) {
    normalized.description = value.description.trim();
  }

  if (typeof value.campaignLabel === "string" && value.campaignLabel.trim()) {
    normalized.campaignLabel = value.campaignLabel.trim();
  }

  const price = Number(value.price);

  if (Number.isFinite(price) && price > 0) {
    normalized.price = Math.round(price);
  }

  return normalized;
}

function createAuditId(productId: string, generatedAt: string): string {
  return `listing.apply.${productId}.${generatedAt.replace(/[^0-9]/g, "").slice(0, 14)}`;
}

function createCampaignLabel(focusLabel: string): string {
  const normalizedFocus = focusLabel.toLocaleLowerCase("tr-TR");

  if (normalizedFocus.includes("stok")) {
    return "Stok kontrollü vitrin";
  }

  if (normalizedFocus.includes("yorum")) {
    return "Güven artıran içerik";
  }

  if (normalizedFocus.includes("iade")) {
    return "Beklenti netleştirme";
  }

  if (normalizedFocus.includes("kârl") || normalizedFocus.includes("karl")) {
    return "Marj korumalı fiyat";
  }

  return "Yavaş stok vitrin indirimi";
}

function createTitleSuffix(focusLabel: string): string {
  const normalizedFocus = focusLabel.toLocaleLowerCase("tr-TR");

  if (normalizedFocus.includes("stok")) {
    return "stokta kontrollü teslim";
  }

  if (normalizedFocus.includes("yorum")) {
    return "kanıtlı müşteri güveni";
  }

  if (normalizedFocus.includes("iade")) {
    return "beklentisi net ürün";
  }

  if (normalizedFocus.includes("kârl") || normalizedFocus.includes("karl")) {
    return "marjı korunan teklif";
  }

  return "hızlandırılmış vitrin";
}

function getPriceMultiplier(focusLabel: string): number {
  const normalizedFocus = focusLabel.toLocaleLowerCase("tr-TR");

  if (normalizedFocus.includes("kârl") || normalizedFocus.includes("karl")) {
    return 1.04;
  }

  if (normalizedFocus.includes("stok")) {
    return 1.02;
  }

  if (normalizedFocus.includes("yorum") || normalizedFocus.includes("iade")) {
    return 0.98;
  }

  return 0.94;
}

function stringifyListingValue(value: string | number): string {
  return typeof value === "number" ? `${value} TRY` : value;
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeSurface(value: unknown): SellerListingMutationSurface | undefined {
  return value === "floating" || value === "route" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
