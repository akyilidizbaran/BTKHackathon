import { buildSmartCartWorkflow } from "@/lib/workflows";
import type {
  BuyerIntentType,
  BuyerManualPreferences,
  BuyerSmartCartWorkflowResult,
} from "@/lib/workflows";
import type { BuyerSensitivity, ReviewTheme } from "@/types/commerce";

export const defaultBuyerId = "buyer-aylin";
export const buyerSmartCartEndpoint = "/api/buyer/smart-cart";

export interface BuyerSmartCartApiContractMeta {
  envelope: "success/data/error";
  source: "buyer-smart-cart-workflow";
  generatedAt: string;
  endpoint: typeof buyerSmartCartEndpoint;
  method: "POST";
}

export interface BuyerSmartCartApiRequest {
  buyerId?: string;
  prompt: string;
  manualPreferences?: BuyerManualPreferences;
}

export interface BuyerSmartCartApiSummary {
  itemCount: number;
  totalPrice: number;
  confidenceScore: number;
  warningCount: number;
  alternativeCount: number;
  complementaryCount: number;
  sellerSignalCount: number;
  intentType: BuyerIntentType;
  intentLabel: string;
  budgetStatusLabel: string;
}

export interface BuyerSmartCartApiData {
  contract: BuyerSmartCartApiContractMeta;
  request: BuyerSmartCartApiRequest;
  summary: BuyerSmartCartApiSummary;
  result: BuyerSmartCartWorkflowResult;
}

export interface BuyerSmartCartExample {
  id: string;
  label: string;
  helper: string;
  buyerId: string;
  prompt: string;
}

export interface BuyerSmartCartValidationError {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export interface BuyerSmartCartValidationSuccess {
  ok: true;
  value: BuyerSmartCartApiRequest;
}

export type BuyerSmartCartValidationResult =
  | BuyerSmartCartValidationError
  | BuyerSmartCartValidationSuccess;

type ManualPreferencesValidationResult =
  | BuyerSmartCartValidationError
  | {
      ok: true;
      value?: BuyerManualPreferences;
    };
type StringArrayPreferenceValidationResult =
  | BuyerSmartCartValidationError
  | {
      ok: true;
      value: string[];
    };
type EnumArrayPreferenceValidationResult<T extends string> =
  | BuyerSmartCartValidationError
  | {
      ok: true;
      value: T[];
    };
type MaxDeliveryDaysValidationResult =
  | BuyerSmartCartValidationError
  | {
      ok: true;
      value?: number;
    };

const maxPromptLength = 280;
const maxManualPreferenceItems = 12;
const maxManualPreferenceTextLength = 48;
const maxManualDeliveryDays = 14;
const validBuyerSensitivities: ReadonlySet<BuyerSensitivity> = new Set([
  "fast_shipping",
  "low_price",
  "color_match",
  "quiet_product",
  "easy_return",
  "premium_quality",
  "compact_size",
]);
const validReviewThemes: ReadonlySet<ReviewTheme> = new Set([
  "kargo-hizi",
  "paketleme",
  "kurulum",
  "malzeme-kalitesi",
  "fiyat-performans",
  "renk-uyumu",
  "ses-seviyesi",
  "konfor",
  "boyut",
  "uyumluluk",
  "dayaniklilik",
  "tasarim",
  "iade-riski",
]);

export const buyerSmartCartExamples: BuyerSmartCartExample[] = [
  {
    id: "home-office-fast",
    label: "Ev ofis",
    helper: "Bütçe + hızlı kargo",
    buyerId: "buyer-aylin",
    prompt: "3.000 TL altında hızlı kargolu ev ofis setup kur.",
  },
  {
    id: "coffee-starter",
    label: "Kahve seti",
    helper: "Başlangıç paketi",
    buyerId: "buyer-deniz",
    prompt: "1.500 TL altında kahve seti kur.",
  },
  {
    id: "meeting-setup",
    label: "Toplantı",
    helper: "Kamera + ses + bağlantı",
    buyerId: "buyer-aylin",
    prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
  },
  {
    id: "desk-style",
    label: "Masa stili",
    helper: "Renk uyumu",
    buyerId: "buyer-emre",
    prompt: "Siyah ve gri renklerde masa takımı diz.",
  },
  {
    id: "sports-audio",
    label: "Spor ses",
    helper: "Konfor sinyali",
    buyerId: "buyer-burak",
    prompt: "Spor için kulağı yormayan kablosuz kulaklık öner.",
  },
];

export function getDefaultBuyerSmartCartApiData(): BuyerSmartCartApiData {
  const defaultExample = buyerSmartCartExamples[0];

  return getBuyerSmartCartApiData({
    buyerId: defaultExample.buyerId,
    prompt: defaultExample.prompt,
  });
}

export function getBuyerSmartCartApiData(
  request: BuyerSmartCartApiRequest,
): BuyerSmartCartApiData {
  const normalizedRequest = {
    ...request,
    buyerId: request.buyerId || defaultBuyerId,
    prompt: request.prompt.trim(),
  };
  const result = buildSmartCartWorkflow(normalizedRequest);

  return {
    contract: {
      envelope: "success/data/error",
      source: "buyer-smart-cart-workflow",
      generatedAt: result.generatedAt,
      endpoint: buyerSmartCartEndpoint,
      method: "POST",
    },
    request: normalizedRequest,
    summary: {
      itemCount: result.selectedItems.length,
      totalPrice: Math.round(result.totalPrice),
      confidenceScore: result.confidenceScore,
      warningCount: result.warnings.length,
      alternativeCount: result.alternatives.length,
      complementaryCount: result.complementarySuggestions.length,
      sellerSignalCount: result.sellerSignalCandidates.length,
      intentType: result.intent.type,
      intentLabel: getIntentLabel(result.intent.type),
      budgetStatusLabel: getBudgetStatusLabel(result),
    },
    result,
  };
}

export function validateBuyerSmartCartRequest(
  rawInput: unknown,
): BuyerSmartCartValidationResult {
  if (!isRecord(rawInput)) {
    return {
      ok: false,
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      status: 400,
    };
  }

  const prompt = typeof rawInput.prompt === "string" ? rawInput.prompt.trim() : "";

  if (!prompt) {
    return {
      ok: false,
      code: "PROMPT_REQUIRED",
      message: "Sepet kurmak için bir alışveriş komutu yazılmalı.",
      status: 400,
    };
  }

  if (prompt.length > maxPromptLength) {
    return {
      ok: false,
      code: "PROMPT_TOO_LONG",
      message: `Komut ${maxPromptLength} karakteri aşmamalı.`,
      status: 400,
    };
  }

  const buyerId = typeof rawInput.buyerId === "string" && rawInput.buyerId.trim()
    ? rawInput.buyerId.trim()
    : defaultBuyerId;
  const manualPreferences = normalizeBuyerManualPreferences(rawInput.manualPreferences);

  if (!manualPreferences.ok) {
    return manualPreferences;
  }

  return {
    ok: true,
    value: {
      buyerId,
      prompt,
      manualPreferences: manualPreferences.value,
    },
  };
}

function normalizeBuyerManualPreferences(value: unknown): ManualPreferencesValidationResult {
  if (typeof value === "undefined") {
    return { ok: true };
  }

  if (!isRecord(value)) {
    return createManualPreferencesError("manualPreferences JSON object olmalı.");
  }

  const preferredColors = normalizeStringArrayPreference(value.preferredColors, "preferredColors");
  const preferredUseCases = normalizeStringArrayPreference(value.preferredUseCases, "preferredUseCases");
  const sensitivities = normalizeEnumArrayPreference(value.sensitivities, "sensitivities", validBuyerSensitivities);
  const avoidReviewThemes = normalizeEnumArrayPreference(value.avoidReviewThemes, "avoidReviewThemes", validReviewThemes);
  const maxDeliveryDays = normalizeMaxDeliveryDays(value.maxDeliveryDays);

  const invalid = [preferredColors, preferredUseCases, sensitivities, avoidReviewThemes, maxDeliveryDays].find(
    (result) => !result.ok,
  );

  if (invalid && !invalid.ok) {
    return invalid;
  }

  const normalized: BuyerManualPreferences = {};

  if (preferredColors.ok && preferredColors.value.length > 0) {
    normalized.preferredColors = preferredColors.value;
  }

  if (preferredUseCases.ok && preferredUseCases.value.length > 0) {
    normalized.preferredUseCases = preferredUseCases.value;
  }

  if (sensitivities.ok && sensitivities.value.length > 0) {
    normalized.sensitivities = sensitivities.value;
  }

  if (avoidReviewThemes.ok && avoidReviewThemes.value.length > 0) {
    normalized.avoidReviewThemes = avoidReviewThemes.value;
  }

  if (maxDeliveryDays.ok && typeof maxDeliveryDays.value === "number") {
    normalized.maxDeliveryDays = maxDeliveryDays.value;
  }

  return {
    ok: true,
    value: Object.keys(normalized).length > 0 ? normalized : undefined,
  };
}

function normalizeStringArrayPreference(
  value: unknown,
  field: string,
): StringArrayPreferenceValidationResult {
  if (typeof value === "undefined") {
    return { ok: true, value: [] };
  }

  if (!Array.isArray(value)) {
    return createManualPreferencesError(`${field} array olmalı.`);
  }

  const normalized: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return createManualPreferencesError(`${field} yalnızca string değerler içermeli.`);
    }

    const text = item.trim();

    if (!text) {
      continue;
    }

    if (text.length > maxManualPreferenceTextLength) {
      return createManualPreferencesError(`${field} içindeki değerler ${maxManualPreferenceTextLength} karakteri aşmamalı.`);
    }

    if (!normalized.includes(text)) {
      normalized.push(text);
    }
  }

  if (normalized.length > maxManualPreferenceItems) {
    return createManualPreferencesError(`${field} en fazla ${maxManualPreferenceItems} değer içerebilir.`);
  }

  return { ok: true, value: normalized };
}

function normalizeEnumArrayPreference<T extends string>(
  value: unknown,
  field: string,
  allowedValues: ReadonlySet<T>,
): EnumArrayPreferenceValidationResult<T> {
  if (typeof value === "undefined") {
    return { ok: true, value: [] };
  }

  if (!Array.isArray(value)) {
    return createManualPreferencesError(`${field} array olmalı.`);
  }

  const normalized: T[] = [];

  for (const item of value) {
    if (typeof item !== "string" || !allowedValues.has(item as T)) {
      return createManualPreferencesError(`${field} desteklenmeyen değer içeriyor.`);
    }

    if (!normalized.includes(item as T)) {
      normalized.push(item as T);
    }
  }

  if (normalized.length > maxManualPreferenceItems) {
    return createManualPreferencesError(`${field} en fazla ${maxManualPreferenceItems} değer içerebilir.`);
  }

  return { ok: true, value: normalized };
}

function normalizeMaxDeliveryDays(value: unknown): MaxDeliveryDaysValidationResult {
  if (typeof value === "undefined") {
    return { ok: true };
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maxManualDeliveryDays) {
    return createManualPreferencesError(`maxDeliveryDays 1-${maxManualDeliveryDays} arasında tam sayı olmalı.`);
  }

  return { ok: true, value };
}

function createManualPreferencesError(message: string): BuyerSmartCartValidationError {
  return {
    ok: false,
    code: "INVALID_MANUAL_PREFERENCES",
    message,
    status: 400,
  };
}

function getIntentLabel(intentType: BuyerIntentType): string {
  const labels: Record<BuyerIntentType, string> = {
    coffee_starter: "Kahve başlangıç seti",
    desk_style_set: "Masa stili",
    generic: "Genel alışveriş",
    gift_finder: "Hediye seçimi",
    home_office_setup: "Ev ofis setup",
    meeting_setup: "Toplantı setup",
    sports_audio: "Spor ses ürünü",
  };

  return labels[intentType];
}

function getBudgetStatusLabel(result: BuyerSmartCartWorkflowResult): string {
  if (!result.budget) {
    return "Bütçe belirtilmedi";
  }

  if (result.isOverSoftBudget) {
    return "Bütçe toleransı aşıldı";
  }

  if (result.isOverRequestedBudget) {
    return "%5 tolerans içinde";
  }

  return "Bütçe içinde";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
