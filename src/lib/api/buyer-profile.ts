import { defaultBuyerId } from "@/lib/api/buyer";
import {
  getBuyerCatalogApiData,
  type BuyerCatalogImage,
} from "@/lib/api/buyer-catalog";
import { getBuyerProfile } from "@/lib/data";
import type {
  Buyer,
  BuyerSensitivity,
  Review,
  ReviewTheme,
} from "@/types/commerce";

export const buyerProfileEndpoint = "/api/buyer/profile";

export type BuyerProfilePreferenceId =
  | "avoid_synthetic"
  | "budget_sensitive"
  | "color_match"
  | "compact_size"
  | "easy_return"
  | "fast_shipping"
  | "old_money_style"
  | "premium_quality"
  | "quiet_product";

export interface BuyerProfileApiContractMeta {
  envelope: "success/data/error";
  source: "buyer-profile-mock";
  generatedAt: string;
  endpoint: typeof buyerProfileEndpoint;
  method: "GET" | "PATCH";
}

export interface BuyerProfilePreference {
  id: BuyerProfilePreferenceId;
  label: string;
  helper: string;
  signal: string;
}

export interface BuyerProfileEditableState {
  buyerId: string;
  personalNote: string;
  selectedPreferenceIds: BuyerProfilePreferenceId[];
  preferredColors: string[];
  budgetBand: Buyer["budgetBand"];
  updatedAt: string;
}

export interface BuyerProfileReviewRow {
  id: string;
  productId: string;
  productName: string;
  productBrand: string;
  productHref: string;
  image: BuyerCatalogImage;
  rating: Review["rating"];
  title: string;
  body: string;
  themes: ReviewTheme[];
  sentimentLabel: string;
  deliveryDays: number;
  createdAt: string;
}

export interface BuyerProfileLearnedSignal {
  id: string;
  title: string;
  summary: string;
  sourceLabel: string;
  priorityScore: number;
}

export interface BuyerProfileApiData {
  contract: BuyerProfileApiContractMeta;
  buyer: {
    id: string;
    name: string;
    city: string;
    persona: string;
  };
  editable: BuyerProfileEditableState;
  preferences: BuyerProfilePreference[];
  reviews: BuyerProfileReviewRow[];
  learnedSignals: BuyerProfileLearnedSignal[];
  agentPreview: {
    title: string;
    summary: string;
    promptExample: string;
    appliedRules: string[];
  };
  summary: {
    reviewCount: number;
    selectedPreferenceCount: number;
    preferredColorCount: number;
    signalCount: number;
  };
}

export interface BuyerProfilePatchValidationError {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export interface BuyerProfilePatchValidationSuccess {
  ok: true;
  value: BuyerProfileEditableState;
}

export type BuyerProfilePatchValidationResult =
  | BuyerProfilePatchValidationError
  | BuyerProfilePatchValidationSuccess;

const maxPersonalNoteLength = 520;
const maxColorCount = 6;
const maxColorLength = 28;

export const buyerProfilePreferences: BuyerProfilePreference[] = [
  {
    id: "fast_shipping",
    label: "Hızlı kargo",
    helper: "Teslimat gecikmesine daha hassas davran.",
    signal: "Kargo hızı",
  },
  {
    id: "easy_return",
    label: "Kolay iade",
    helper: "İade riski ve paketleme yorumlarını öne çıkar.",
    signal: "İade güveni",
  },
  {
    id: "old_money_style",
    label: "Sade stil",
    helper: "Logosu az, temiz ve kolay kombinlenen ürünleri öne al.",
    signal: "Stil tercihi",
  },
  {
    id: "premium_quality",
    label: "Premium kalite",
    helper: "Malzeme ve uzun kullanım yorumlarını ağırlıklandır.",
    signal: "Kalite beklentisi",
  },
  {
    id: "budget_sensitive",
    label: "Bütçe hassasiyeti",
    helper: "Alternatifleri ve bütçe aşımını daha görünür yap.",
    signal: "Fiyat kontrolü",
  },
  {
    id: "avoid_synthetic",
    label: "Sentetik kumaş istemem",
    helper: "Kumaş ve içerik belirsizliğinde uyar.",
    signal: "Materyal filtresi",
  },
  {
    id: "color_match",
    label: "Renk uyumu",
    helper: "Tercih edilen renk paletiyle uyuşan ürünleri öne al.",
    signal: "Renk paleti",
  },
  {
    id: "quiet_product",
    label: "Sessiz ürün",
    helper: "Ses seviyesi yorumlarını karar sinyaline çevir.",
    signal: "Ses hassasiyeti",
  },
  {
    id: "compact_size",
    label: "Kompakt boyut",
    helper: "Küçük alan ve taşınabilirlik sinyallerini kullan.",
    signal: "Boyut tercihi",
  },
];

const sensitivityPreferenceMap: Record<BuyerSensitivity, BuyerProfilePreferenceId> = {
  color_match: "color_match",
  compact_size: "compact_size",
  easy_return: "easy_return",
  fast_shipping: "fast_shipping",
  low_price: "budget_sensitive",
  premium_quality: "premium_quality",
  quiet_product: "quiet_product",
};

export function getDefaultBuyerProfileApiData(): BuyerProfileApiData {
  const data = getBuyerProfileApiData({ buyerId: defaultBuyerId });

  if (!data) {
    throw new Error("Default buyer profile could not be generated.");
  }

  return data;
}

export function getBuyerProfileApiData(input: {
  buyerId?: string | null;
  editableOverride?: Partial<BuyerProfileEditableState>;
  method?: "GET" | "PATCH";
} = {}): BuyerProfileApiData | undefined {
  const buyerId = input.buyerId?.trim() || defaultBuyerId;
  const profile = getBuyerProfile(buyerId);

  if (!profile) {
    return undefined;
  }

  const editable = normalizeEditableState({
    ...createDefaultEditableState(profile.buyer),
    ...input.editableOverride,
    buyerId: profile.buyer.id,
  });
  const reviews = createReviewRows(profile.reviews);
  const learnedSignals = createLearnedSignals(profile.buyer, profile.reviews, editable);

  return {
    contract: {
      endpoint: buyerProfileEndpoint,
      envelope: "success/data/error",
      generatedAt: "2026-05-16",
      method: input.method ?? "GET",
      source: "buyer-profile-mock",
    },
    buyer: {
      city: profile.buyer.city,
      id: profile.buyer.id,
      name: profile.buyer.name,
      persona: profile.buyer.persona,
    },
    editable,
    preferences: buyerProfilePreferences,
    reviews,
    learnedSignals,
    agentPreview: createAgentPreview(editable, learnedSignals),
    summary: {
      preferredColorCount: editable.preferredColors.length,
      reviewCount: reviews.length,
      selectedPreferenceCount: editable.selectedPreferenceIds.length,
      signalCount: learnedSignals.length,
    },
  };
}

export function validateBuyerProfilePatchRequest(rawInput: unknown): BuyerProfilePatchValidationResult {
  if (!isRecord(rawInput)) {
    return {
      ok: false,
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      status: 400,
    };
  }

  const buyerId = typeof rawInput.buyerId === "string" && rawInput.buyerId.trim()
    ? rawInput.buyerId.trim()
    : defaultBuyerId;
  const profile = getBuyerProfile(buyerId);

  if (!profile) {
    return {
      ok: false,
      code: "BUYER_NOT_FOUND",
      message: "Alıcı profili bulunamadı.",
      status: 404,
    };
  }

  const personalNote = typeof rawInput.personalNote === "string"
    ? rawInput.personalNote.trim()
    : createDefaultPersonalNote(profile.buyer);

  if (personalNote.length > maxPersonalNoteLength) {
    return {
      ok: false,
      code: "NOTE_TOO_LONG",
      message: `Profil notu ${maxPersonalNoteLength} karakteri aşmamalı.`,
      status: 400,
    };
  }

  const selectedPreferenceIds = normalizePreferenceIds(rawInput.selectedPreferenceIds);
  const preferredColors = normalizeColors(rawInput.preferredColors);
  const budgetBand = normalizeBudgetBand(rawInput.budgetBand, profile.buyer.budgetBand);

  return {
    ok: true,
    value: normalizeEditableState({
      budgetBand,
      buyerId: profile.buyer.id,
      personalNote,
      preferredColors,
      selectedPreferenceIds,
      updatedAt: new Date().toISOString(),
    }),
  };
}

function createDefaultEditableState(buyer: Buyer): BuyerProfileEditableState {
  return normalizeEditableState({
    budgetBand: buyer.budgetBand,
    buyerId: buyer.id,
    personalNote: createDefaultPersonalNote(buyer),
    preferredColors: buyer.preferredColors,
    selectedPreferenceIds: buyer.sensitivities.map((sensitivity) => sensitivityPreferenceMap[sensitivity]),
    updatedAt: "2026-05-16T00:00:00.000Z",
  });
}

function createDefaultPersonalNote(buyer: Buyer): string {
  return [
    "Sade ve kaliteli ürünleri severim.",
    buyer.notes[0] ?? "",
    "Kargo, malzeme ve yorum sinyalleri önerilerde açık görünsün.",
  ]
    .filter(Boolean)
    .join(" ");
}

function createReviewRows(reviews: Review[]): BuyerProfileReviewRow[] {
  const catalogProducts = getBuyerCatalogApiData().products;
  const productById = new Map(catalogProducts.map((product) => [product.id, product]));

  return reviews.slice(0, 6).map((review) => {
    const product = productById.get(review.productId);

    return {
      body: review.body,
      createdAt: review.createdAt,
      deliveryDays: review.deliveryDays,
      id: review.id,
      image: product?.image ?? {
        alt: review.title,
        position: "0% 0%",
        src: "/catalog/buyer-product-sprite.png",
      },
      productBrand: product?.brand ?? "CommercePilot",
      productHref: product?.href ?? "/buyer/products",
      productId: review.productId,
      productName: product?.name ?? review.title,
      rating: review.rating,
      sentimentLabel: getSentimentLabel(review.sentiment),
      themes: review.themes,
      title: review.title,
    };
  });
}

function createLearnedSignals(
  buyer: Buyer,
  reviews: Review[],
  editable: BuyerProfileEditableState,
): BuyerProfileLearnedSignal[] {
  const themeCounts = countValues(reviews.flatMap((review) => review.themes));
  const selectedPreferenceSet = new Set(editable.selectedPreferenceIds);
  const signals: BuyerProfileLearnedSignal[] = [];

  if (selectedPreferenceSet.has("fast_shipping") || themeCounts.get("kargo-hizi")) {
    signals.push({
      id: "shipping-sensitivity",
      priorityScore: 88,
      sourceLabel: `${themeCounts.get("kargo-hizi") ?? 0} yorum + profil tercihi`,
      summary: "Agent hızlı teslimatlı ürünleri öne alır ve gecikme riski görülen ürünleri uyarı olarak gösterir.",
      title: "Kargo hassasiyeti",
    });
  }

  if (selectedPreferenceSet.has("premium_quality") || themeCounts.get("malzeme-kalitesi")) {
    signals.push({
      id: "quality-expectation",
      priorityScore: 84,
      sourceLabel: `${themeCounts.get("malzeme-kalitesi") ?? 0} kalite teması`,
      summary: "Malzeme kalitesi, uzun kullanım ve doğrulanmış yorumlar öneri güven skorunda daha ağır basar.",
      title: "Kalite beklentisi",
    });
  }

  if (selectedPreferenceSet.has("easy_return") || themeCounts.get("paketleme") || themeCounts.get("iade-riski")) {
    signals.push({
      id: "return-packaging",
      priorityScore: 79,
      sourceLabel: "İade ve paketleme sinyalleri",
      summary: "Agent paketleme, iade ve satıcı açıklığıyla ilgili negatif temaları satın almadan önce görünür yapar.",
      title: "İade güveni",
    });
  }

  if (selectedPreferenceSet.has("color_match") || editable.preferredColors.length > 0) {
    signals.push({
      id: "color-style",
      priorityScore: 76,
      sourceLabel: `${editable.preferredColors.length} tercih edilen renk`,
      summary: `${editable.preferredColors.join(", ")} paletine yakın ürünler ve sade stil sinyalleri öne çıkar.`,
      title: "Renk ve stil uyumu",
    });
  }

  if (selectedPreferenceSet.has("quiet_product") || themeCounts.get("ses-seviyesi")) {
    signals.push({
      id: "quiet-product",
      priorityScore: 72,
      sourceLabel: `${themeCounts.get("ses-seviyesi") ?? 0} ses teması`,
      summary: "Mouse, kulaklık, kahve ekipmanı gibi ürünlerde ses seviyesi yorumu karar desteğine bağlanır.",
      title: "Sessiz kullanım",
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "general-personalization",
      priorityScore: 64,
      sourceLabel: buyer.persona,
      summary: "Agent profil notunu, renkleri ve önceki yorumları öneri gerekçelerine taşır.",
      title: "Genel kişiselleştirme",
    });
  }

  return signals.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
}

function createAgentPreview(
  editable: BuyerProfileEditableState,
  learnedSignals: BuyerProfileLearnedSignal[],
): BuyerProfileApiData["agentPreview"] {
  const primarySignal = learnedSignals[0];
  const colorRule = editable.preferredColors.length > 0
    ? `${editable.preferredColors.join(", ")} renkleri ürün uyumunda kontrol edilir.`
    : "Renk tercihi yoksa Agent nötr ve ürün bağlamına uygun paletleri kullanır.";

  return {
    appliedRules: [
      `${editable.budgetBand} bütçe bandı öneri sıralamasına katılır.`,
      colorRule,
      `${editable.selectedPreferenceIds.length} tercih chip'i Agent gerekçesine eklenir.`,
    ],
    promptExample: "3000 TL altında sade, kaliteli ve hızlı kargolu kombin öner.",
    summary: primarySignal
      ? `${primarySignal.title} Agent'ın ilk dikkat edeceği sinyal olur.`
      : "Agent profil metnini ürün seçimi ve uyarılara bağlar.",
    title: "Agent önerileri nasıl değişir?",
  };
}

function normalizeEditableState(input: BuyerProfileEditableState): BuyerProfileEditableState {
  return {
    budgetBand: normalizeBudgetBand(input.budgetBand, "orta"),
    buyerId: input.buyerId,
    personalNote: input.personalNote.trim().slice(0, maxPersonalNoteLength),
    preferredColors: normalizeColors(input.preferredColors),
    selectedPreferenceIds: normalizePreferenceIds(input.selectedPreferenceIds),
    updatedAt: input.updatedAt,
  };
}

function normalizePreferenceIds(value: unknown): BuyerProfilePreferenceId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set(buyerProfilePreferences.map((preference) => preference.id));
  const normalizedIds = value
    .filter((item): item is BuyerProfilePreferenceId => typeof item === "string" && validIds.has(item as BuyerProfilePreferenceId));

  return Array.from(new Set(normalizedIds));
}

function normalizeColors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim().toLocaleLowerCase("tr-TR") : ""))
        .filter(Boolean)
        .map((item) => item.slice(0, maxColorLength)),
    ),
  ).slice(0, maxColorCount);
}

function normalizeBudgetBand(value: unknown, fallback: Buyer["budgetBand"]): Buyer["budgetBand"] {
  return value === "ekonomik" || value === "orta" || value === "premium" ? value : fallback;
}

function countValues<TValue>(values: TValue[]): Map<TValue, number> {
  const counts = new Map<TValue, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return counts;
}

function getSentimentLabel(sentiment: Review["sentiment"]): string {
  const labels: Record<Review["sentiment"], string> = {
    negative: "Negatif",
    neutral: "Nötr",
    positive: "Pozitif",
  };

  return labels[sentiment];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
