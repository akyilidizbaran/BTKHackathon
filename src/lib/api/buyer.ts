import { buildSmartCartWorkflow } from "@/lib/workflows";
import type {
  BuyerIntentType,
  BuyerManualPreferences,
  BuyerSmartCartWorkflowResult,
} from "@/lib/workflows";

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

const maxPromptLength = 280;

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
  const manualPreferences = isRecord(rawInput.manualPreferences)
    ? (rawInput.manualPreferences as BuyerManualPreferences)
    : undefined;

  return {
    ok: true,
    value: {
      buyerId,
      prompt,
      manualPreferences,
    },
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
