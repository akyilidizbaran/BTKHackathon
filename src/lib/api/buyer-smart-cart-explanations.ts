import { generateLlmText } from "@/lib/llm";
import type { LlmTextGenerationResult } from "@/lib/llm";
import {
  buyerSmartCartEndpoint,
  defaultBuyerId,
  getBuyerSmartCartApiData,
  type BuyerSmartCartApiData,
  type BuyerSmartCartApiRequest,
} from "@/lib/api/buyer";

export const buyerSmartCartExplanationEndpoint = "/api/buyer/smart-cart/explanation";

export interface BuyerSmartCartExplanationApiContractMeta {
  envelope: "success/data/error";
  source: "llm-explanation";
  generatedAt: string;
  endpoint: typeof buyerSmartCartExplanationEndpoint;
  method: "POST";
  modelCall: "runtime-only";
}

export interface BuyerSmartCartExplanationApiData {
  contract: BuyerSmartCartExplanationApiContractMeta;
  request: BuyerSmartCartApiRequest;
  summary: {
    itemCount: number;
    confidenceScore: number;
    totalPrice: number;
    intentLabel: string;
    budgetStatusLabel: string;
  };
  explanation: BuyerSmartCartModelExplanation;
  source: {
    smartCartEndpoint: typeof buyerSmartCartEndpoint;
    selectedItemCount: number;
    warningCount: number;
    alternativeCount: number;
    complementaryCount: number;
    sellerSignalCount: number;
  };
}

export interface BuyerSmartCartModelExplanation {
  status: "generated" | "fallback";
  provider: LlmTextGenerationResult["provider"];
  model: string;
  generatedAt: string;
  headline: string;
  summary: string;
  evidenceBullets: string[];
  buyerDecision: string;
  riskNote: string;
  sellerSignalBridge: string;
  cartAdjustment: string;
  fallbackReason?: string;
}

export interface BuyerSmartCartExplanationOptions {
  forceFallback?: boolean;
}

interface ParsedExplanationBody {
  headline: string;
  summary: string;
  evidenceBullets: string[];
  buyerDecision: string;
  riskNote: string;
  sellerSignalBridge: string;
  cartAdjustment: string;
}

export async function getBuyerSmartCartExplanationApiData(
  request: BuyerSmartCartApiRequest,
  options: BuyerSmartCartExplanationOptions = {},
): Promise<BuyerSmartCartExplanationApiData> {
  const smartCart = getBuyerSmartCartApiData({
    ...request,
    buyerId: request.buyerId || defaultBuyerId,
  });
  const fallbackBody = createFallbackExplanationBody(smartCart);
  const fallbackText = JSON.stringify(fallbackBody);
  const llmResult = options.forceFallback
    ? createForcedFallbackResult(fallbackText)
    : await generateLlmText({
        fallbackText,
        input: createBuyerSmartCartExplanationInput(smartCart),
        instructions: createBuyerSmartCartExplanationInstructions(),
        metadata: {
          buyer_id: smartCart.request.buyerId ?? defaultBuyerId,
          intent_type: smartCart.summary.intentType,
          task: "buyer_smart_cart_explanation",
        },
      });
  const parsed = parseModelExplanation(llmResult.text, fallbackBody);
  const status = parsed.usedFallback || llmResult.status === "fallback" ? "fallback" : "generated";
  const fallbackReason = getFallbackReason(llmResult, parsed.usedFallback);

  return {
    contract: {
      endpoint: buyerSmartCartExplanationEndpoint,
      envelope: "success/data/error",
      generatedAt: llmResult.generatedAt,
      method: "POST",
      modelCall: "runtime-only",
      source: "llm-explanation",
    },
    explanation: {
      ...parsed.body,
      fallbackReason,
      generatedAt: llmResult.generatedAt,
      model: llmResult.model,
      provider: llmResult.provider,
      status,
    },
    request: smartCart.request,
    source: {
      alternativeCount: smartCart.result.alternatives.length,
      complementaryCount: smartCart.result.complementarySuggestions.length,
      selectedItemCount: smartCart.result.selectedItems.length,
      sellerSignalCount: smartCart.result.sellerSignalCandidates.length,
      smartCartEndpoint: buyerSmartCartEndpoint,
      warningCount: smartCart.result.warnings.length,
    },
    summary: {
      budgetStatusLabel: smartCart.summary.budgetStatusLabel,
      confidenceScore: smartCart.summary.confidenceScore,
      intentLabel: smartCart.summary.intentLabel,
      itemCount: smartCart.summary.itemCount,
      totalPrice: smartCart.summary.totalPrice,
    },
  };
}

function createBuyerSmartCartExplanationInstructions(): string {
  return [
    "CommercePilot buyer smart cart explanation katmanısın.",
    "Sadece verilen JSON context içindeki ürün, uyarı, bütçe, güven ve satıcı sinyali verilerini kullan; veri uydurma.",
    "Çıktıyı Türkçe, kısa, karar güveni odaklı ve alıcının neden bu sepeti görmesi gerektiğini açıklayacak şekilde yaz.",
    "Kesinlikle geçerli JSON dön. Markdown, açıklama veya code fence kullanma.",
    'JSON shape: {"headline":"...","summary":"...","evidenceBullets":["..."],"buyerDecision":"...","riskNote":"...","sellerSignalBridge":"...","cartAdjustment":"..."}',
    "evidenceBullets 3-4 madde olsun; her madde verilen selectedItems, warnings, alternatives veya sellerSignals alanına dayanmalı.",
  ].join("\n");
}

function createBuyerSmartCartExplanationInput(smartCart: BuyerSmartCartApiData): string {
  return JSON.stringify(
    {
      budget: {
        budget: smartCart.result.budget,
        budgetStatusLabel: smartCart.summary.budgetStatusLabel,
        isOverRequestedBudget: smartCart.result.isOverRequestedBudget,
        isOverSoftBudget: smartCart.result.isOverSoftBudget,
        remainingBudget: smartCart.result.remainingBudget,
        softBudgetLimit: smartCart.result.softBudgetLimit,
        totalPrice: smartCart.summary.totalPrice,
      },
      buyer: {
        buyerId: smartCart.request.buyerId,
        buyerName: smartCart.result.buyerName,
        personalizationNotes: smartCart.result.buyerPersonalizationNotes,
      },
      cart: {
        confidenceScore: smartCart.summary.confidenceScore,
        intentLabel: smartCart.summary.intentLabel,
        itemCount: smartCart.summary.itemCount,
        prompt: smartCart.result.prompt,
      },
      selectedItems: smartCart.result.selectedItems.map((item) => ({
        cartRole: item.cartRole,
        confidenceScore: item.confidenceScore,
        price: item.price,
        productName: item.productName,
        quantity: item.quantity,
        reasons: item.reasons,
        warnings: item.warnings.map((warning) => ({
          message: warning.message,
          severity: warning.severity,
          title: warning.title,
        })),
      })),
      alternatives: smartCart.result.alternatives.slice(0, 3),
      complementarySuggestions: smartCart.result.complementarySuggestions.slice(0, 3),
      sellerSignals: smartCart.result.sellerSignalCandidates.map((signal) => ({
        summary: signal.summary,
        type: signal.type,
      })),
      warnings: smartCart.result.warnings.map((warning) => ({
        message: warning.message,
        severity: warning.severity,
        title: warning.title,
      })),
    },
    null,
    2,
  );
}

function createFallbackExplanationBody(smartCart: BuyerSmartCartApiData): ParsedExplanationBody {
  const primaryItem = smartCart.result.selectedItems[0];
  const primaryWarning = smartCart.result.warnings[0];
  const primaryAlternative = smartCart.result.alternatives[0] ?? smartCart.result.complementarySuggestions[0];
  const primarySignal = smartCart.result.sellerSignalCandidates[0];
  const itemEvidence = smartCart.result.selectedItems
    .slice(0, 3)
    .map((item) => `${item.cartRole}: ${item.productName}, güven ${item.confidenceScore}/100. ${item.reasons[0]}`)
    .filter(Boolean);
  const warningEvidence = primaryWarning ? [`Uyarı: ${primaryWarning.title}. ${primaryWarning.message}`] : [];
  const evidenceBullets = [...itemEvidence, ...warningEvidence].slice(0, 4);

  return {
    buyerDecision: primaryItem
      ? `Önce ${primaryItem.productName} kararını koru; bu ürün sepet rolünü en net taşıyor.`
      : "Komutu biraz daha netleştirerek sepet kararını yeniden üret.",
    cartAdjustment: primaryAlternative
      ? `${primaryAlternative.productName} alternatif veya tamamlayıcı olarak izlenebilir.`
      : "Bu sepet için ek alternatif önerisi gerekmiyor.",
    evidenceBullets,
    headline: `${smartCart.summary.intentLabel} için sepet kararı`,
    riskNote: primaryWarning?.message ?? "Bu sepet için kritik satın alma uyarısı yok.",
    sellerSignalBridge: primarySignal?.summary ?? "Bu sepet satıcı tarafına düşük öncelikli talep sinyali olarak döner.",
    summary: `${smartCart.summary.itemCount} ürün ${smartCart.summary.budgetStatusLabel.toLocaleLowerCase("tr-TR")} seçildi; toplam ${smartCart.summary.totalPrice.toLocaleString("tr-TR")} TL ve güven skoru ${smartCart.summary.confidenceScore}/100.`,
  };
}

function createForcedFallbackResult(fallbackText: string): LlmTextGenerationResult {
  return {
    error: {
      code: "FORCED_FALLBACK",
      message: "Validation canlı LLM çağrısı yapmadan deterministik fallback'i doğruladı.",
    },
    generatedAt: new Date().toISOString(),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    provider: "deterministic",
    status: "fallback",
    text: fallbackText,
  };
}

function parseModelExplanation(
  text: string,
  fallbackBody: ParsedExplanationBody,
): { body: ParsedExplanationBody; usedFallback: boolean } {
  const parsed = parseJsonObject(text);

  if (!parsed) {
    return {
      body: fallbackBody,
      usedFallback: true,
    };
  }

  return {
    body: {
      buyerDecision: normalizeString(parsed.buyerDecision, fallbackBody.buyerDecision),
      cartAdjustment: normalizeString(parsed.cartAdjustment, fallbackBody.cartAdjustment),
      evidenceBullets: normalizeStringArray(parsed.evidenceBullets, fallbackBody.evidenceBullets, 4),
      headline: normalizeString(parsed.headline, fallbackBody.headline),
      riskNote: normalizeString(parsed.riskNote, fallbackBody.riskNote),
      sellerSignalBridge: normalizeString(parsed.sellerSignalBridge, fallbackBody.sellerSignalBridge),
      summary: normalizeString(parsed.summary, fallbackBody.summary),
    },
    usedFallback: false,
  };
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  const candidate = firstBrace >= 0 && lastBrace > firstBrace ? withoutFence.slice(firstBrace, lastBrace + 1) : withoutFence;

  try {
    const parsed = JSON.parse(candidate) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[], limit: number): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, limit);

  return normalized.length > 0 ? normalized : fallback;
}

function getFallbackReason(llmResult: LlmTextGenerationResult, usedFallback: boolean): string | undefined {
  if (llmResult.error) {
    return `${llmResult.error.code}: ${llmResult.error.message}`;
  }

  if (usedFallback) {
    return "MODEL_JSON_PARSE_FAILED: Model çıktısı beklenen JSON contract'ına uymadı.";
  }

  return undefined;
}
