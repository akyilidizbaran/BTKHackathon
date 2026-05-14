import { generateLlmText } from "@/lib/llm";
import type { LlmTextGenerationResult } from "@/lib/llm";
import {
  demoSellerId,
  getSellerActionDetailApiData,
  type SellerActionDetailApiData,
} from "@/lib/api/seller";

export function sellerActionExplanationEndpoint(actionId: string): string {
  return `/api/seller/actions/${actionId}/explanation`;
}

export interface SellerActionExplanationApiContractMeta {
  envelope: "success/data/error";
  source: "llm-explanation";
  generatedAt: string;
  sellerId: string;
  endpoint: string;
  method: "GET";
  actionId: string;
  modelCall: "runtime-only";
}

export interface SellerActionExplanationApiData {
  contract: SellerActionExplanationApiContractMeta;
  action: {
    id: string;
    title: string;
    type: string;
    priorityScore: number;
    timeHorizonLabel: string;
  };
  explanation: SellerActionModelExplanation;
  source: {
    actionEndpoint: string;
    affectedProductCount: number;
    evidenceCount: number;
    relatedBuyerSignalCount: number;
  };
}

export interface SellerActionModelExplanation {
  status: "generated" | "fallback";
  provider: LlmTextGenerationResult["provider"];
  model: string;
  generatedAt: string;
  headline: string;
  summary: string;
  evidenceBullets: string[];
  nextBestAction: string;
  sellerMessageDraft: string;
  fallbackReason?: string;
}

export interface SellerActionExplanationOptions {
  sellerId?: string;
  forceFallback?: boolean;
}

interface ParsedExplanationBody {
  headline: string;
  summary: string;
  evidenceBullets: string[];
  nextBestAction: string;
  sellerMessageDraft: string;
}

export async function getSellerActionExplanationApiData(
  actionId: string,
  options: SellerActionExplanationOptions = {},
): Promise<SellerActionExplanationApiData | undefined> {
  const sellerId = options.sellerId ?? demoSellerId;
  const detail = getSellerActionDetailApiData(actionId, sellerId);

  if (!detail) {
    return undefined;
  }

  const fallbackBody = createFallbackExplanationBody(detail);
  const fallbackText = JSON.stringify(fallbackBody);
  const llmResult = options.forceFallback
    ? createForcedFallbackResult(fallbackText)
    : await generateLlmText({
        fallbackText,
        input: createSellerActionExplanationInput(detail),
        instructions: createSellerActionExplanationInstructions(),
        metadata: {
          action_id: detail.action.id,
          seller_id: detail.seller.id,
          task: "seller_action_explanation",
        },
      });
  const parsed = parseModelExplanation(llmResult.text, fallbackBody);
  const status = parsed.usedFallback || llmResult.status === "fallback" ? "fallback" : "generated";
  const fallbackReason = getFallbackReason(llmResult, parsed.usedFallback);

  return {
    contract: {
      actionId: detail.action.id,
      endpoint: sellerActionExplanationEndpoint(detail.action.id),
      envelope: "success/data/error",
      generatedAt: llmResult.generatedAt,
      method: "GET",
      modelCall: "runtime-only",
      sellerId: detail.seller.id,
      source: "llm-explanation",
    },
    action: {
      id: detail.action.id,
      priorityScore: detail.action.priorityScore,
      timeHorizonLabel: detail.action.timeHorizonLabel,
      title: detail.action.title,
      type: detail.action.type,
    },
    explanation: {
      ...parsed.body,
      fallbackReason,
      generatedAt: llmResult.generatedAt,
      model: llmResult.model,
      provider: llmResult.provider,
      status,
    },
    source: {
      actionEndpoint: detail.contract.endpoint,
      affectedProductCount: detail.affectedProducts.length,
      evidenceCount: detail.evidenceSnapshot.length,
      relatedBuyerSignalCount: detail.relatedBuyerSignals.length,
    },
  };
}

function createSellerActionExplanationInstructions(): string {
  return [
    "CommercePilot seller action explanation katmanısın.",
    "Sadece verilen JSON context içindeki kanıtları kullan; veri uydurma, yeni metrik ekleme.",
    "Çıktıyı Türkçe, kısa, satıcı operasyonuna dönük ve yapılacak iş odaklı yaz.",
    "Kesinlikle geçerli JSON dön. Markdown, açıklama veya code fence kullanma.",
    'JSON shape: {"headline":"...","summary":"...","evidenceBullets":["..."],"nextBestAction":"...","sellerMessageDraft":"..."}',
    "evidenceBullets 3-4 madde olsun; her madde verilen evidence veya metric alanına dayanmalı.",
  ].join("\n");
}

function createSellerActionExplanationInput(detail: SellerActionDetailApiData): string {
  return JSON.stringify(
    {
      action: {
        categoryLabel: detail.action.categoryLabel,
        expectedOutcome: detail.action.expectedOutcome,
        impactLabel: detail.action.impactLabel,
        priorityScore: detail.action.priorityScore,
        recommendedNextStep: detail.action.recommendedNextStep,
        summary: detail.action.summary,
        timeHorizonLabel: detail.action.timeHorizonLabel,
        title: detail.action.title,
        type: detail.action.type,
        urgencyLabel: detail.action.urgencyLabel,
      },
      affectedProducts: detail.affectedProducts.slice(0, 4).map((product) => ({
        healthScore: product.healthScore,
        name: product.name,
        orders30d: product.orders30d,
        revenue30d: product.revenue30d,
        stockStatusLabel: product.stockStatusLabel,
      })),
      buyerSignals: detail.relatedBuyerSignals.slice(0, 3).map((signal) => ({
        priorityScore: signal.priorityScore,
        sourcePrompt: signal.sourcePrompt,
        summary: signal.summary,
        typeLabel: signal.typeLabel,
      })),
      drafts: detail.executionPreview.generatedDrafts,
      evidenceSnapshot: detail.evidenceSnapshot,
      executionSteps: detail.executionPreview.steps.map((step) => ({
        detail: step.detail,
        owner: step.owner,
        priorityLabel: step.priorityLabel,
        title: step.title,
      })),
      llmReadyFacts: detail.llmReadyContext.facts,
    },
    null,
    2,
  );
}

function createFallbackExplanationBody(detail: SellerActionDetailApiData): ParsedExplanationBody {
  const primaryProduct = detail.affectedProducts[0]?.name ?? "ilgili ürün";
  const evidenceBullets = detail.evidenceSnapshot
    .slice(0, 4)
    .map((item) => `${item.label}: ${item.value}. ${item.helper}`)
    .filter(Boolean);
  const firstDraft = detail.executionPreview.generatedDrafts[0]?.body;

  return {
    evidenceBullets,
    headline: detail.action.title,
    nextBestAction: detail.action.recommendedNextStep || detail.executionPreview.steps[0]?.detail || detail.action.expectedOutcome,
    sellerMessageDraft:
      firstDraft ??
      `${primaryProduct} için ${detail.executionPreview.primaryOwner} sahibiyle aksiyon planı başlatılmalı.`,
    summary: `${detail.action.summary} ${detail.action.expectedOutcome}`,
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
      evidenceBullets: normalizeStringArray(parsed.evidenceBullets, fallbackBody.evidenceBullets, 4),
      headline: normalizeString(parsed.headline, fallbackBody.headline),
      nextBestAction: normalizeString(parsed.nextBestAction, fallbackBody.nextBestAction),
      sellerMessageDraft: normalizeString(parsed.sellerMessageDraft, fallbackBody.sellerMessageDraft),
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
