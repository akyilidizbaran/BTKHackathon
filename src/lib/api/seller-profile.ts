import {
  demoSellerId,
  getSellerOverviewApiData,
  type SellerOverviewAlertId,
} from "@/lib/api/seller";

export const sellerProfileEndpoint = "/api/seller/profile";

export type SellerAgentPermissionMode =
  | "chat-only"
  | "draft-only"
  | "approved-apply";

export type SellerAgentCapabilityId =
  | "auto-apply"
  | "campaign-draft"
  | "listing-draft"
  | "price-suggestion"
  | "product-analysis"
  | "review-reply-draft"
  | "stock-alert";

export type SellerNotificationChannelId =
  | "email"
  | "panel"
  | "weekly-summary"
  | "whatsapp";

export type SellerAlertRuleId =
  | "negative-reviews"
  | "return-risk"
  | "slow-movers"
  | "stock-risk";

export type SellerAlertThreshold = "low" | "medium" | "high" | "critical";

export interface SellerProfileApiContractMeta {
  envelope: "success/data/error";
  source: "seller-profile-mock";
  generatedAt: string;
  endpoint: typeof sellerProfileEndpoint;
  method: "GET" | "PATCH";
}

export interface SellerProfilePermissionModeOption {
  id: SellerAgentPermissionMode;
  label: string;
  helper: string;
  summary: string;
  recommendedCapabilityIds: SellerAgentCapabilityId[];
}

export interface SellerAgentCapability {
  id: SellerAgentCapabilityId;
  label: string;
  helper: string;
  locked?: boolean;
  requiresApproval: boolean;
}

export interface SellerNotificationChannel {
  id: SellerNotificationChannelId;
  label: string;
  helper: string;
}

export interface SellerProfileAlertRule {
  id: SellerAlertRuleId;
  label: string;
  helper: string;
  threshold: SellerAlertThreshold;
  enabled: boolean;
  affectedProductCount: number;
  href: string;
}

export interface SellerProfileEditableState {
  sellerId: string;
  storeDisplayName: string;
  supportResponseHours: number;
  defaultDeliveryPromiseDays: number;
  returnWindowDays: number;
  permissionMode: SellerAgentPermissionMode;
  enabledCapabilityIds: SellerAgentCapabilityId[];
  notificationChannelIds: SellerNotificationChannelId[];
  alertRules: SellerProfileAlertRule[];
  quietHours: {
    start: string;
    end: string;
  };
  proactiveControls: {
    floatingBadgeEnabled: boolean;
    muteAll: boolean;
    disableOnProductPages: boolean;
    hideFloatingAgent: boolean;
  };
  updatedAt: string;
}

export interface SellerProfileAuditItem {
  id: string;
  actorName: string;
  action: string;
  detail: string;
  createdAt: string;
  tone: "calm" | "good" | "warning";
}

export interface SellerProfilePolicyPreview {
  title: string;
  summary: string;
  rules: string[];
}

export interface SellerProfileApiData {
  contract: SellerProfileApiContractMeta;
  seller: {
    id: string;
    name: string;
    displayName: string;
    rating: number;
  };
  editable: SellerProfileEditableState;
  permissionModes: SellerProfilePermissionModeOption[];
  capabilities: SellerAgentCapability[];
  notificationChannels: SellerNotificationChannel[];
  auditTrail: SellerProfileAuditItem[];
  policyPreview: SellerProfilePolicyPreview;
  agentPreview: {
    title: string;
    summary: string;
    appliedRules: string[];
    promptExample: string;
  };
  summary: {
    selectedCapabilityCount: number;
    enabledNotificationCount: number;
    enabledAlertRuleCount: number;
    permissionLabel: string;
    autoApplyAllowed: boolean;
    quietHoursLabel: string;
  };
}

export interface SellerProfilePatchValidationError {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export interface SellerProfilePatchValidationSuccess {
  ok: true;
  value: SellerProfileEditableState;
}

export type SellerProfilePatchValidationResult =
  | SellerProfilePatchValidationError
  | SellerProfilePatchValidationSuccess;

const maxStoreNameLength = 72;
const minSupportResponseHours = 1;
const maxSupportResponseHours = 72;
const minDeliveryDays = 1;
const maxDeliveryDays = 14;
const minReturnWindowDays = 0;
const maxReturnWindowDays = 60;

export const sellerProfilePermissionModes: SellerProfilePermissionModeOption[] = [
  {
    helper: "Agent analiz eder, ürün alanlarına dokunmaz.",
    id: "chat-only",
    label: "Sadece sohbet",
    recommendedCapabilityIds: ["product-analysis", "stock-alert"],
    summary: "Analiz ve uyarı açık; taslak ve uygulama kapalı.",
  },
  {
    helper: "Başlık, açıklama, fiyat ve kampanya önerileri önce/sonra taslak olarak görünür.",
    id: "draft-only",
    label: "Öneri ve taslak",
    recommendedCapabilityIds: [
      "product-analysis",
      "listing-draft",
      "price-suggestion",
      "campaign-draft",
      "stock-alert",
      "review-reply-draft",
    ],
    summary: "Satıcı onayı olmadan değişiklik yok; Agent güvenli taslak üretir.",
  },
  {
    helper: "Satıcı onayı sonrası listeleme taslağı uygulanabilir ve işlem geçmişine yazılır.",
    id: "approved-apply",
    label: "Onaylı uygulama",
    recommendedCapabilityIds: [
      "product-analysis",
      "listing-draft",
      "price-suggestion",
      "campaign-draft",
      "stock-alert",
      "review-reply-draft",
    ],
    summary: "Uygulama yalnızca açık onaydan sonra çalışır; otomatik uygulama kapalı kalır.",
  },
];

export const sellerAgentCapabilities: SellerAgentCapability[] = [
  {
    helper: "Ürün sağlığı, stok, satış ve yorum sinyallerini okuyabilir.",
    id: "product-analysis",
    label: "Ürün analizi",
    requiresApproval: false,
  },
  {
    helper: "Başlık ve açıklama için before/after taslak oluşturabilir.",
    id: "listing-draft",
    label: "Listeleme taslağı",
    requiresApproval: true,
  },
  {
    helper: "Marj ve dönüşüm sinyaliyle fiyat önerisi hazırlayabilir.",
    id: "price-suggestion",
    label: "Fiyat önerisi",
    requiresApproval: true,
  },
  {
    helper: "Bundle, kupon ve kampanya fikrini action detayına bağlayabilir.",
    id: "campaign-draft",
    label: "Kampanya önerisi",
    requiresApproval: true,
  },
  {
    helper: "Reorder point altındaki ürünlerde sessiz uyarı gösterebilir.",
    id: "stock-alert",
    label: "Stok uyarısı",
    requiresApproval: false,
  },
  {
    helper: "Negatif yorumlara yanıt taslağı üretir, yayınlamaz.",
    id: "review-reply-draft",
    label: "Yorum yanıt taslağı",
    requiresApproval: true,
  },
  {
    helper: "Bu fazda kilitli: Agent kullanıcı onayı olmadan uygulama yapamaz.",
    id: "auto-apply",
    label: "Otomatik uygulama",
    locked: true,
    requiresApproval: true,
  },
];

export const sellerNotificationChannels: SellerNotificationChannel[] = [
  {
    helper: "Satıcı panelinde badge ve sessiz uyarı olarak görünür.",
    id: "panel",
    label: "Panel bildirimi",
  },
  {
    helper: "Gün içinde kritik stok ve yorum özetini gönderir.",
    id: "email",
    label: "E-posta",
  },
  {
    helper: "Kritik eşiklerde mağaza sahibine kısa mesaj gönderir.",
    id: "whatsapp",
    label: "WhatsApp",
  },
  {
    helper: "Haftalık ürün sağlığı ve Agent öneri özetini yollar.",
    id: "weekly-summary",
    label: "Haftalık özet",
  },
];

const validPermissionModes = new Set<SellerAgentPermissionMode>(
  sellerProfilePermissionModes.map((mode) => mode.id),
);
const validCapabilityIds = new Set<SellerAgentCapabilityId>(
  sellerAgentCapabilities.map((capability) => capability.id),
);
const lockedCapabilityIds = new Set<SellerAgentCapabilityId>(
  sellerAgentCapabilities
    .filter((capability) => capability.locked)
    .map((capability) => capability.id),
);
const validNotificationChannelIds = new Set<SellerNotificationChannelId>(
  sellerNotificationChannels.map((channel) => channel.id),
);
const validAlertThresholds = new Set<SellerAlertThreshold>([
  "low",
  "medium",
  "high",
  "critical",
]);

const alertIdToOverviewId: Record<SellerAlertRuleId, SellerOverviewAlertId> = {
  "negative-reviews": "negative_reviews",
  "return-risk": "return_risk",
  "slow-movers": "slow_movers",
  "stock-risk": "stock_risk",
};

export function getDefaultSellerProfileApiData(): SellerProfileApiData {
  const data = getSellerProfileApiData({ sellerId: demoSellerId });

  if (!data) {
    throw new Error("Default seller profile could not be generated.");
  }

  return data;
}

export function getSellerProfileApiData(input: {
  sellerId?: string | null;
  editableOverride?: Partial<SellerProfileEditableState>;
  method?: "GET" | "PATCH";
} = {}): SellerProfileApiData | undefined {
  const sellerId = input.sellerId?.trim() || demoSellerId;
  const overview = getSellerOverviewApiData(sellerId);

  if (!overview) {
    return undefined;
  }

  const editable = normalizeEditableState({
    ...createDefaultEditableState(overview),
    ...input.editableOverride,
    sellerId: overview.seller.id,
  }, overview);
  const permissionMode = sellerProfilePermissionModes.find((mode) => mode.id === editable.permissionMode);
  const auditTrail = createAuditTrail(editable);
  const policyPreview = createPolicyPreview(editable);
  const autoApplyAllowed = editable.enabledCapabilityIds.includes("auto-apply");

  return {
    agentPreview: createAgentPreview(editable),
    auditTrail,
    capabilities: sellerAgentCapabilities,
    contract: {
      endpoint: sellerProfileEndpoint,
      envelope: "success/data/error",
      generatedAt: "2026-05-16",
      method: input.method ?? "GET",
      source: "seller-profile-mock",
    },
    editable,
    notificationChannels: sellerNotificationChannels,
    permissionModes: sellerProfilePermissionModes,
    policyPreview,
    seller: {
      displayName: overview.seller.displayName,
      id: overview.seller.id,
      name: overview.seller.name,
      rating: overview.seller.rating,
    },
    summary: {
      autoApplyAllowed,
      enabledAlertRuleCount: editable.alertRules.filter((rule) => rule.enabled).length,
      enabledNotificationCount: editable.notificationChannelIds.length,
      permissionLabel: permissionMode?.label ?? "Öneri ve taslak",
      quietHoursLabel: `${editable.quietHours.start} - ${editable.quietHours.end}`,
      selectedCapabilityCount: editable.enabledCapabilityIds.length,
    },
  };
}

export function validateSellerProfilePatchRequest(rawInput: unknown): SellerProfilePatchValidationResult {
  if (!isRecord(rawInput)) {
    return {
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      ok: false,
      status: 400,
    };
  }

  const sellerId = typeof rawInput.sellerId === "string" && rawInput.sellerId.trim()
    ? rawInput.sellerId.trim()
    : demoSellerId;
  const overview = getSellerOverviewApiData(sellerId);

  if (!overview) {
    return {
      code: "SELLER_NOT_FOUND",
      message: "Satıcı profili bulunamadı.",
      ok: false,
      status: 404,
    };
  }

  const defaultEditable = createDefaultEditableState(overview);
  const storeDisplayName = typeof rawInput.storeDisplayName === "string"
    ? rawInput.storeDisplayName.trim()
    : defaultEditable.storeDisplayName;

  if (!storeDisplayName) {
    return {
      code: "STORE_NAME_REQUIRED",
      message: "Mağaza adı boş bırakılamaz.",
      ok: false,
      status: 400,
    };
  }

  if (storeDisplayName.length > maxStoreNameLength) {
    return {
      code: "STORE_NAME_TOO_LONG",
      message: `Mağaza adı ${maxStoreNameLength} karakteri aşmamalı.`,
      ok: false,
      status: 400,
    };
  }

  return {
    ok: true,
    value: normalizeEditableState({
      alertRules: normalizeAlertRules(rawInput.alertRules, defaultEditable.alertRules),
      defaultDeliveryPromiseDays: normalizeNumber(
        rawInput.defaultDeliveryPromiseDays,
        defaultEditable.defaultDeliveryPromiseDays,
        minDeliveryDays,
        maxDeliveryDays,
      ),
      enabledCapabilityIds: normalizeCapabilityIds(rawInput.enabledCapabilityIds, defaultEditable.permissionMode),
      notificationChannelIds: normalizeNotificationChannelIds(rawInput.notificationChannelIds),
      permissionMode: normalizePermissionMode(rawInput.permissionMode),
      proactiveControls: normalizeProactiveControls(rawInput.proactiveControls, defaultEditable.proactiveControls),
      quietHours: normalizeQuietHours(rawInput.quietHours, defaultEditable.quietHours),
      returnWindowDays: normalizeNumber(
        rawInput.returnWindowDays,
        defaultEditable.returnWindowDays,
        minReturnWindowDays,
        maxReturnWindowDays,
      ),
      sellerId: overview.seller.id,
      storeDisplayName,
      supportResponseHours: normalizeNumber(
        rawInput.supportResponseHours,
        defaultEditable.supportResponseHours,
        minSupportResponseHours,
        maxSupportResponseHours,
      ),
      updatedAt: new Date().toISOString(),
    }, overview),
  };
}

function createDefaultEditableState(overview: NonNullable<ReturnType<typeof getSellerOverviewApiData>>): SellerProfileEditableState {
  return normalizeEditableState({
    alertRules: createDefaultAlertRules(overview),
    defaultDeliveryPromiseDays: overview.seller.defaultDeliveryPromiseDays,
    enabledCapabilityIds: sellerProfilePermissionModes[1].recommendedCapabilityIds,
    notificationChannelIds: ["panel", "email", "weekly-summary"],
    permissionMode: "draft-only",
    proactiveControls: {
      disableOnProductPages: false,
      floatingBadgeEnabled: true,
      hideFloatingAgent: false,
      muteAll: false,
    },
    quietHours: {
      end: "09:00",
      start: "22:30",
    },
    returnWindowDays: 14,
    sellerId: overview.seller.id,
    storeDisplayName: overview.seller.displayName,
    supportResponseHours: overview.seller.supportResponseHours,
    updatedAt: "2026-05-16T00:00:00.000Z",
  }, overview);
}

function createDefaultAlertRules(overview: NonNullable<ReturnType<typeof getSellerOverviewApiData>>): SellerProfileAlertRule[] {
  const alertById = new Map(overview.alertCards.map((alert) => [alert.id, alert]));
  const rules: Array<Omit<SellerProfileAlertRule, "affectedProductCount" | "href">> = [
    {
      enabled: true,
      helper: "Reorder point altına inen ürünler panelde sessiz badge alır.",
      id: "stock-risk",
      label: "Stok riski",
      threshold: "critical",
    },
    {
      enabled: true,
      helper: "Tekrar eden şikayetler action kuyruğunda öne alınır.",
      id: "negative-reviews",
      label: "Negatif yorum",
      threshold: "medium",
    },
    {
      enabled: true,
      helper: "İade baskısı ürün açıklaması ve operasyon önerisine bağlanır.",
      id: "return-risk",
      label: "İade riski",
      threshold: "medium",
    },
    {
      enabled: true,
      helper: "Satış hızı düşen ürünler kampanya veya içerik önerisine girer.",
      id: "slow-movers",
      label: "Satılmayan ürün",
      threshold: "high",
    },
  ];

  return rules.map((rule) => {
    const overviewAlert = alertById.get(alertIdToOverviewId[rule.id]);

    return {
      ...rule,
      affectedProductCount: overviewAlert?.productCount ?? 0,
      href: overviewAlert?.href ?? "/seller/actions",
    };
  });
}

function normalizeEditableState(
  editable: Partial<SellerProfileEditableState>,
  overview: NonNullable<ReturnType<typeof getSellerOverviewApiData>>,
): SellerProfileEditableState {
  const permissionMode = normalizePermissionMode(editable.permissionMode);
  const enabledCapabilityIds = normalizeCapabilityIds(editable.enabledCapabilityIds, permissionMode);

  return {
    alertRules: normalizeAlertRules(editable.alertRules, createDefaultAlertRules(overview)),
    defaultDeliveryPromiseDays: normalizeNumber(
      editable.defaultDeliveryPromiseDays,
      overview.seller.defaultDeliveryPromiseDays,
      minDeliveryDays,
      maxDeliveryDays,
    ),
    enabledCapabilityIds,
    notificationChannelIds: normalizeNotificationChannelIds(editable.notificationChannelIds),
    permissionMode,
    proactiveControls: normalizeProactiveControls(editable.proactiveControls, {
      disableOnProductPages: false,
      floatingBadgeEnabled: true,
      hideFloatingAgent: false,
      muteAll: false,
    }),
    quietHours: normalizeQuietHours(editable.quietHours, { end: "09:00", start: "22:30" }),
    returnWindowDays: normalizeNumber(editable.returnWindowDays, 14, minReturnWindowDays, maxReturnWindowDays),
    sellerId: typeof editable.sellerId === "string" && editable.sellerId.trim()
      ? editable.sellerId.trim()
      : overview.seller.id,
    storeDisplayName: typeof editable.storeDisplayName === "string" && editable.storeDisplayName.trim()
      ? editable.storeDisplayName.trim().slice(0, maxStoreNameLength)
      : overview.seller.displayName,
    supportResponseHours: normalizeNumber(
      editable.supportResponseHours,
      overview.seller.supportResponseHours,
      minSupportResponseHours,
      maxSupportResponseHours,
    ),
    updatedAt: typeof editable.updatedAt === "string" ? editable.updatedAt : new Date().toISOString(),
  };
}

function normalizePermissionMode(value: unknown): SellerAgentPermissionMode {
  return typeof value === "string" && validPermissionModes.has(value as SellerAgentPermissionMode)
    ? (value as SellerAgentPermissionMode)
    : "draft-only";
}

function normalizeCapabilityIds(
  value: unknown,
  permissionMode: SellerAgentPermissionMode,
): SellerAgentCapabilityId[] {
  const fallbackMode = sellerProfilePermissionModes.find((mode) => mode.id === permissionMode) ?? sellerProfilePermissionModes[1];
  const rawItems = Array.isArray(value) ? value : fallbackMode.recommendedCapabilityIds;
  const normalized = uniqueStrings(rawItems)
    .filter((item): item is SellerAgentCapabilityId => validCapabilityIds.has(item as SellerAgentCapabilityId))
    .filter((item) => !lockedCapabilityIds.has(item));

  if (permissionMode === "chat-only") {
    return normalized.filter((item) => item === "product-analysis" || item === "stock-alert");
  }

  return normalized.length > 0 ? normalized : fallbackMode.recommendedCapabilityIds;
}

function normalizeNotificationChannelIds(value: unknown): SellerNotificationChannelId[] {
  const rawItems = Array.isArray(value) ? value : ["panel", "email", "weekly-summary"];
  const normalized = uniqueStrings(rawItems)
    .filter((item): item is SellerNotificationChannelId => validNotificationChannelIds.has(item as SellerNotificationChannelId));

  return normalized.length > 0 ? normalized : ["panel"];
}

function normalizeAlertRules(
  value: unknown,
  defaultRules: SellerProfileAlertRule[],
): SellerProfileAlertRule[] {
  if (!Array.isArray(value)) {
    return defaultRules;
  }

  const rawRules = new Map(
    value
      .filter(isRecord)
      .map((rule) => [typeof rule.id === "string" ? rule.id : "", rule]),
  );

  return defaultRules.map((defaultRule) => {
    const rawRule = rawRules.get(defaultRule.id);

    if (!rawRule) {
      return defaultRule;
    }

    const threshold = typeof rawRule.threshold === "string" &&
      validAlertThresholds.has(rawRule.threshold as SellerAlertThreshold)
      ? (rawRule.threshold as SellerAlertThreshold)
      : defaultRule.threshold;

    return {
      ...defaultRule,
      enabled: typeof rawRule.enabled === "boolean" ? rawRule.enabled : defaultRule.enabled,
      threshold,
    };
  });
}

function normalizeQuietHours(
  value: unknown,
  fallback: SellerProfileEditableState["quietHours"],
): SellerProfileEditableState["quietHours"] {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    end: normalizeTimeString(value.end, fallback.end),
    start: normalizeTimeString(value.start, fallback.start),
  };
}

function normalizeProactiveControls(
  value: unknown,
  fallback: SellerProfileEditableState["proactiveControls"],
): SellerProfileEditableState["proactiveControls"] {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    disableOnProductPages: typeof value.disableOnProductPages === "boolean"
      ? value.disableOnProductPages
      : fallback.disableOnProductPages,
    floatingBadgeEnabled: typeof value.floatingBadgeEnabled === "boolean"
      ? value.floatingBadgeEnabled
      : fallback.floatingBadgeEnabled,
    hideFloatingAgent: typeof value.hideFloatingAgent === "boolean"
      ? value.hideFloatingAgent
      : fallback.hideFloatingAgent,
    muteAll: typeof value.muteAll === "boolean" ? value.muteAll : fallback.muteAll,
  };
}

function createAgentPreview(editable: SellerProfileEditableState): SellerProfileApiData["agentPreview"] {
  const permissionMode = sellerProfilePermissionModes.find((mode) => mode.id === editable.permissionMode);
  const channelLabels = sellerNotificationChannels
    .filter((channel) => editable.notificationChannelIds.includes(channel.id))
    .map((channel) => channel.label);
  const alertLabels = editable.alertRules
    .filter((rule) => rule.enabled)
    .map((rule) => `${rule.label}: ${getThresholdLabel(rule.threshold)}`);

  return {
    appliedRules: [
      permissionMode?.summary ?? "Öneri ve taslak modu aktif.",
      `Bildirim kanalları: ${channelLabels.join(", ")}`,
      `Sessiz saat: ${editable.quietHours.start} - ${editable.quietHours.end}`,
      ...alertLabels.slice(0, 3),
    ],
    promptExample: "Satılmayan ürünlerimi sırala; öneriyi taslak olarak hazırla ama onay almadan uygulama.",
    summary: `${editable.storeDisplayName} için Agent ${permissionMode?.label.toLocaleLowerCase("tr-TR") ?? "öneri"} modunda çalışır; otomatik uygulama kapalıdır.`,
    title: "Agent çalışma sınırı",
  };
}

function createPolicyPreview(editable: SellerProfileEditableState): SellerProfilePolicyPreview {
  const autoApplyBlocked = !editable.enabledCapabilityIds.includes("auto-apply");

  return {
    rules: [
      "Listeleme, fiyat ve kampanya değişikliği onay gerektirir.",
      autoApplyBlocked ? "Otomatik uygulama kilitli ve kapalı." : "Otomatik uygulama yalnızca demo dışı kapalı tutulmalı.",
      editable.proactiveControls.muteAll
        ? "Proactive uyarılar sessize alınmış durumda."
        : "Proactive uyarılar badge ve panel bildirimiyle sınırlı.",
      `Sessiz saatler ${editable.quietHours.start} - ${editable.quietHours.end}.`,
    ],
    summary: "Floating Agent ve route Agent aynı izin sınırını kullanır.",
    title: "Onay ve işlem geçmişi politikası",
  };
}

function createAuditTrail(editable: SellerProfileEditableState): SellerProfileAuditItem[] {
  return [
    {
      action: "Permission modu güncellendi",
      actorName: "Derya Kaya",
      createdAt: "2026-05-16 16:42",
      detail: `${getPermissionLabel(editable.permissionMode)} modu aktif edildi.`,
      id: "audit-permission-mode",
      tone: "good",
    },
    {
      action: "Bildirim sınırı değişti",
      actorName: "Mert Arslan",
      createdAt: "2026-05-16 15:18",
      detail: `${editable.notificationChannelIds.length} kanal ve ${editable.alertRules.filter((rule) => rule.enabled).length} risk kuralı açık.`,
      id: "audit-notifications",
      tone: "calm",
    },
    {
      action: "Otomatik uygulama engellendi",
      actorName: "Alışveriş Arkadaşım Agent",
      createdAt: "2026-05-16 14:03",
      detail: "Agent taslak üretti, satıcı onayı olmadan değişiklik uygulamadı.",
      id: "audit-agent-boundary",
      tone: "warning",
    },
  ];
}

function getPermissionLabel(permissionMode: SellerAgentPermissionMode): string {
  return sellerProfilePermissionModes.find((mode) => mode.id === permissionMode)?.label ?? "Öneri ve taslak";
}

function getThresholdLabel(threshold: SellerAlertThreshold): string {
  const labels: Record<SellerAlertThreshold, string> = {
    critical: "kritik",
    high: "yüksek",
    low: "düşük",
    medium: "orta",
  };

  return labels[threshold];
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function normalizeTimeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : fallback;
}

function uniqueStrings(value: unknown[]): string[] {
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string")));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
