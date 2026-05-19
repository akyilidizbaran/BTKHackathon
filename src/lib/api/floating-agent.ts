import {
  getBuyerAgentApiData,
  type BuyerAgentApiData,
} from "@/lib/api/buyer-agent";
import {
  getSellerAgentApiData,
  type SellerAgentApiData,
} from "@/lib/api/seller-agent";
import { normalizeFloatingAgentPathname } from "@/lib/agents/floating-agent";
import type { AgentRole } from "@/lib/agents/runtime";
import {
  generateLlmJson,
  getConfiguredLlmModel,
  normalizeLlmString,
} from "@/lib/llm";
import type { LlmJsonValidationResult, LlmTextGenerationResult } from "@/lib/llm";
import {
  analyzeBuyerCatalogPrompt,
  createUnsupportedBuyerCatalogAnswer,
  hasUnsupportedBuyerCatalogTerm,
} from "@/lib/agents/buyer-catalog-guardrails";

export const floatingAgentEndpoint = "/api/agent/floating";

export type FloatingAgentDecisionMode =
  | "buyer-agent"
  | "chat"
  | "clarify"
  | "seller-agent";

export interface FloatingAgentApiRequest {
  actorId?: string;
  history?: FloatingAgentPromptTurn[];
  pathname: string;
  prompt: string;
  role: AgentRole;
}

export interface FloatingAgentPromptTurn {
  content: string;
  role: "assistant" | "user";
}

export interface FloatingAgentApiContractMeta {
  endpoint: typeof floatingAgentEndpoint;
  envelope: "success/data/error";
  generatedAt: string;
  method: "POST";
  source: "floating-agent-intent-orchestrator";
}

export interface FloatingAgentApiData {
  buyerAgent?: BuyerAgentApiData;
  contract: FloatingAgentApiContractMeta;
  decision: {
    actionPrompt?: string;
    confidence: number;
    mode: FloatingAgentDecisionMode;
    reason: string;
  };
  message: {
    content: string;
    role: "assistant";
  };
  orchestration: {
    fallbackReason?: string;
    generatedAt: string;
    model: string;
    provider: LlmTextGenerationResult["provider"];
    status: LlmTextGenerationResult["status"];
  };
  request: Required<Omit<FloatingAgentApiRequest, "history">> & {
    history: FloatingAgentPromptTurn[];
  };
  sellerAgent?: SellerAgentApiData;
}

export interface FloatingAgentApiOptions {
  forceFallback?: boolean;
  modelTextOverride?: string;
}

export interface FloatingAgentValidationError {
  code: string;
  message: string;
  ok: false;
  status: number;
}

export interface FloatingAgentValidationSuccess {
  ok: true;
  value: Required<Omit<FloatingAgentApiRequest, "history">> & {
    history: FloatingAgentPromptTurn[];
  };
}

export type FloatingAgentValidationResult =
  | FloatingAgentValidationError
  | FloatingAgentValidationSuccess;

interface FloatingAgentModelBody {
  actionPrompt?: string;
  answer: string;
  confidence: number;
  mode: FloatingAgentDecisionMode;
  reason: string;
}

const actionModes = new Set<FloatingAgentDecisionMode>(["buyer-agent", "seller-agent"]);

export function validateFloatingAgentRequest(rawInput: unknown): FloatingAgentValidationResult {
  if (!isRecord(rawInput)) {
    return {
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      ok: false,
      status: 400,
    };
  }

  const role = rawInput.role;
  const prompt = typeof rawInput.prompt === "string" ? rawInput.prompt.trim() : "";
  const actorId = typeof rawInput.actorId === "string" && rawInput.actorId.trim().length > 0
    ? rawInput.actorId.trim()
    : role === "seller"
      ? "seller-commercepilot"
      : "buyer-aylin";
  const pathname = normalizeFloatingAgentPathname(
    typeof rawInput.pathname === "string" ? rawInput.pathname : role === "seller" ? "/seller" : "/buyer/products",
  );
  const history = normalizeFloatingAgentHistory(rawInput.history);

  if (role !== "buyer" && role !== "seller") {
    return {
      code: "INVALID_ROLE",
      message: "Floating Agent role buyer veya seller olmalı.",
      ok: false,
      status: 400,
    };
  }

  if (prompt.length < 2) {
    return {
      code: "PROMPT_TOO_SHORT",
      message: "Agent'in karar verebilmesi için en az 2 karakterlik mesaj yazılmalı.",
      ok: false,
      status: 400,
    };
  }

  if (prompt.length > 600) {
    return {
      code: "PROMPT_TOO_LONG",
      message: "Floating Agent mesajı en fazla 600 karakter olabilir.",
      ok: false,
      status: 400,
    };
  }

  return {
    ok: true,
    value: {
      actorId,
      history,
      pathname,
      prompt,
      role,
    },
  };
}

export async function getFloatingAgentApiData(
  request: Required<Omit<FloatingAgentApiRequest, "history">> & {
    history: FloatingAgentPromptTurn[];
  },
  options: FloatingAgentApiOptions = {},
): Promise<FloatingAgentApiData> {
  const fallbackBody = createFallbackFloatingAgentModelBody(request);
  const routeActionLocally = actionModes.has(fallbackBody.mode);
  const llmResult = await generateLlmJson({
    fallbackValue: fallbackBody,
    forceFallback: options.forceFallback || routeActionLocally,
    input: createFloatingAgentModelInput(request),
    instructions: createFloatingAgentModelInstructions(),
    maxOutputTokens: 520,
    metadata: {
      actor_id: request.actorId,
      role: request.role,
      route_context: request.pathname,
      task: "floating_agent_intent_orchestration",
    },
    modelTextOverride: options.modelTextOverride,
    validate: (value, fallbackValue) => validateFloatingAgentModelBody(value, fallbackValue, request),
  });
  const modelBody = llmResult.value;
  const normalizedMode = resolveFinalDecisionMode(modelBody.mode, request);
  const actionPrompt = getActionPrompt(modelBody, request.prompt, normalizedMode, request);
  let buyerAgent: BuyerAgentApiData | undefined;
  let sellerAgent: SellerAgentApiData | undefined;

  if (normalizedMode === "buyer-agent") {
    buyerAgent = await getBuyerAgentApiData({
      buyerId: request.actorId,
      prompt: actionPrompt,
    });
  } else if (normalizedMode === "seller-agent") {
    sellerAgent = await getSellerAgentApiData({
      prompt: actionPrompt,
      sellerId: request.actorId,
    });
  }

  return {
    buyerAgent,
    contract: {
      endpoint: floatingAgentEndpoint,
      envelope: "success/data/error",
      generatedAt: llmResult.generatedAt,
      method: "POST",
      source: "floating-agent-intent-orchestrator",
    },
    decision: {
      actionPrompt: actionModes.has(normalizedMode) ? actionPrompt : undefined,
      confidence: clampConfidence(modelBody.confidence),
      mode: normalizedMode,
      reason: modelBody.reason,
    },
    message: {
      content: createAssistantMessage(modelBody, normalizedMode, request, buyerAgent, sellerAgent),
      role: "assistant",
    },
    orchestration: {
      fallbackReason: llmResult.fallbackReason,
      generatedAt: llmResult.generatedAt,
      model: llmResult.model,
      provider: llmResult.provider,
      status: llmResult.status,
    },
    request,
    sellerAgent,
  };
}

export function getDefaultFloatingAgentApiData(): FloatingAgentApiData {
  const request = {
    actorId: "buyer-aylin",
    history: [],
    pathname: "/buyer/products",
    prompt: "Bu agent neler yapabilir?",
    role: "buyer" as const,
  };
  const fallbackBody = createFallbackFloatingAgentModelBody(request);

  return {
    contract: {
      endpoint: floatingAgentEndpoint,
      envelope: "success/data/error",
      generatedAt: new Date().toISOString(),
      method: "POST",
      source: "floating-agent-intent-orchestrator",
    },
    decision: {
      confidence: fallbackBody.confidence,
      mode: fallbackBody.mode,
      reason: fallbackBody.reason,
    },
    message: {
      content: fallbackBody.answer,
      role: "assistant",
    },
    orchestration: {
      fallbackReason: "STATIC_FLOATING_AGENT_PREVIEW: İlk render canlı LLM çağrısı yapmadan deterministik contract kullanır.",
      generatedAt: new Date().toISOString(),
      model: getConfiguredLlmModel(),
      provider: "deterministic",
      status: "fallback",
    },
    request,
  };
}

function createFloatingAgentModelInstructions(): string {
  return [
    "Alışveriş Arkadaşım sağ alt sohbet yardımcısı için intent router olarak davran.",
    "Yanıtı yalnızca JSON object olarak üret.",
    "mode alanı sadece chat, clarify, buyer-agent veya seller-agent olabilir.",
    "Kullanıcı ürün önerisi, sepet hazırlama, sepet değiştirme, listing taslağı, satıcı ürün analizi veya operasyonel aksiyon isterse agent mode seç.",
    "Kullanıcı ürünün nasıl çalıştığını, ne yapabileceğini, güvenlik/onay sınırlarını, kargo/yorum/ürün seçimi mantığını veya genel yardım sorarsa chat mode seç.",
    "Kullanıcı belirsiz bir şey isterse clarify mode seç ve kısa netleştirme sorusu sor.",
    "Alışveriş Arkadaşım dışı açık alan sorularında uydurma bilgi verme; commerce bağlamına dönerek kibarca sınır belirt.",
    "Mutation yapıldığını iddia etme; action mode sadece onay bekleyen öneri/taslak hazırlar.",
    "Türkçe, kısa, kullanıcı dostu ve uygulama içi chatbot tonu kullan.",
    'Şema: {"mode":"chat|clarify|buyer-agent|seller-agent","confidence":0.0,"answer":"kısa yanıt","actionPrompt":"agent için normalize edilmiş komut","reason":"karar gerekçesi"}',
  ].join("\n");
}

function createFloatingAgentModelInput(
  request: Required<Omit<FloatingAgentApiRequest, "history">> & {
    history: FloatingAgentPromptTurn[];
  },
): string {
  return JSON.stringify({
    actorId: request.actorId,
    history: request.history.slice(-4),
    pathname: request.pathname,
    prompt: request.prompt,
    role: request.role,
    safeCapabilities: request.role === "buyer"
      ? [
          "Katalogdaki ürünlerden öneri hazırlama",
          "Kullanıcı onayı sonrası sepete ekleme/değiştirme preview'i",
          "Ürün, yorum ve teslimat sinyallerini açıklama",
        ]
      : [
          "Satıcı ürünlerini analiz etme",
          "Stok, iade, yorum ve yavaş satış aksiyonlarını sıralama",
          "Kullanıcı onayı sonrası listing draft preview'i",
        ],
  });
}

function createFallbackFloatingAgentModelBody(
  request: Required<Omit<FloatingAgentApiRequest, "history">> & {
    history: FloatingAgentPromptTurn[];
  },
): FloatingAgentModelBody {
  const normalizedPrompt = normalizeForIntent(request.prompt);

  if (isHelpPrompt(normalizedPrompt)) {
    return {
      answer: createHelpAnswer(request.role),
      confidence: 0.78,
      mode: "chat",
      reason: "Kullanıcı ürün içi yardım veya çalışma mantığı soruyor.",
    };
  }

  if (isOutOfScopePrompt(normalizedPrompt)) {
    return {
      answer: "Ben Alışveriş Arkadaşım içinde alışveriş, sepet, ürün yorumu ve satıcı operasyonları için yardımcı olurum. Bu konuda bir ürün, sepet ya da mağaza sorusu sorarsan net şekilde ilerleyebilirim.",
      confidence: 0.72,
      mode: "chat",
      reason: "Soru Alışveriş Arkadaşım commerce bağlamı dışında.",
    };
  }

  if (request.role === "buyer" && isSellerOnlyPrompt(normalizedPrompt)) {
    return {
      answer: "Bu alıcı panelinde satıcı operasyonu çalıştıramam. Satılmayan ürün, stok, listing veya mağaza analizi için satıcı merkezindeki Agent'ı kullanmalısın.",
      confidence: 0.74,
      mode: "chat",
      reason: "Kullanıcı buyer rolünde seller-only operasyon istiyor.",
    };
  }

  if (request.role === "seller" && isBuyerOnlyPrompt(normalizedPrompt)) {
    return {
      answer: "Bu satıcı panelinde alıcı sepeti hazırlayamam. Sepet veya hediye önerisi için alıcı tarafındaki Agent'ı kullanmalısın.",
      confidence: 0.74,
      mode: "chat",
      reason: "Kullanıcı seller rolünde buyer-only alışveriş görevi istiyor.",
    };
  }

  if (request.role === "buyer" && !analyzeBuyerCatalogPrompt(normalizedPrompt).ok) {
    return {
      answer: analyzeBuyerCatalogPrompt(normalizedPrompt).message ?? createUnsupportedBuyerCatalogAnswer(),
      confidence: 0.76,
      mode: "chat",
      reason: "Kullanıcı katalogda bulunmayan belirgin bir ürün tipi istiyor.",
    };
  }

  if (request.role === "buyer" && isBuyerActionPrompt(normalizedPrompt)) {
    return {
      actionPrompt: request.prompt,
      answer: "Bunu ürün önerisi olarak hazırlıyorum. Onay vermeden sepetini değiştirmem.",
      confidence: 0.82,
      mode: "buyer-agent",
      reason: "Kullanıcı katalog/sepet odaklı agentic alışveriş görevi istiyor.",
    };
  }

  if (request.role === "seller" && isSellerActionPrompt(normalizedPrompt)) {
    return {
      actionPrompt: request.prompt,
      answer: "Bunu satıcı aksiyon analizi olarak hazırlıyorum. Onay vermeden listing değişikliği yapmam.",
      confidence: 0.82,
      mode: "seller-agent",
      reason: "Kullanıcı satıcı operasyonu veya listing taslağı istiyor.",
    };
  }

  if (isClarificationPrompt(normalizedPrompt)) {
    return {
      answer: request.role === "buyer"
        ? "Ne için alışveriş yapmak istediğini, bütçeni veya teslimat beklentini yazarsan katalogdan daha doğru bir seçki hazırlayabilirim."
        : "Hangi satıcı problemini çözmek istediğini yazarsan stok, yorum, iade veya listeleme tarafında öncelikli aksiyonu çıkarabilirim.",
      confidence: 0.62,
      mode: "clarify",
      reason: "İstek eksik veya aksiyon hedefi belirsiz.",
    };
  }

  return {
    answer: request.role === "buyer"
      ? "Ürün seçimi, yorum güveni, teslimat ve sepet hazırlama konusunda yardımcı olabilirim. İstersen ihtiyacını yaz, katalogdan onay bekleyen bir öneri hazırlayayım."
      : "Ürün performansı, stok riski, iade, yorum ve listing iyileştirme tarafında yardımcı olabilirim. İstersen hangi alanı incelememi istediğini yaz.",
    confidence: 0.68,
    mode: "chat",
    reason: "Mesaj genel sohbet/yardım niteliğinde, doğrudan mutation gerektirmiyor.",
  };
}

function validateFloatingAgentModelBody(
  value: Record<string, unknown>,
  fallbackValue: FloatingAgentModelBody,
  request: FloatingAgentApiRequest,
): LlmJsonValidationResult<FloatingAgentModelBody> {
  const rawMode = normalizeLlmString(value.mode, "").replace("_", "-");
  const mode = isFloatingAgentDecisionMode(rawMode)
    ? normalizeDecisionModeForRole(rawMode, request.role)
    : fallbackValue.mode;
  const answer = normalizeLlmString(value.answer, "") || fallbackValue.answer;
  const reason = normalizeLlmString(value.reason, "") || fallbackValue.reason;
  const rawActionPrompt = normalizeLlmString(value.actionPrompt, "");
  const actionPrompt = rawActionPrompt || fallbackValue.actionPrompt || request.prompt;
  const confidence = typeof value.confidence === "number"
    ? clampConfidence(value.confidence)
    : fallbackValue.confidence;

  if (!answer) {
    return {
      code: "FLOATING_AGENT_EMPTY_ANSWER",
      message: "Floating Agent model cevabı boş döndü.",
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      actionPrompt: actionModes.has(mode) ? actionPrompt : undefined,
      answer,
      confidence,
      mode,
      reason,
    },
  };
}

function createAssistantMessage(
  modelBody: FloatingAgentModelBody,
  mode: FloatingAgentDecisionMode,
  request: FloatingAgentApiRequest,
  buyerAgent?: BuyerAgentApiData,
  sellerAgent?: SellerAgentApiData,
): string {
  if (mode === "buyer-agent" && buyerAgent) {
    return `Katalogdaki mevcut ürünlerden ${buyerAgent.summary.itemCount} ürünlük bir öneri hazırladım; istersen aşağıdan sepete ekleyebilirsin.`;
  }

  if (mode === "seller-agent" && sellerAgent) {
    return `Satıcı verilerindeki ${sellerAgent.summary.productCount} ürünü inceledim; onay bekleyen taslak aşağıda.`;
  }

  if (mode === "chat" || mode === "clarify") {
    return sanitizeChatAnswer(modelBody.answer, request);
  }

  return modelBody.answer;
}

function sanitizeChatAnswer(answer: string, request: FloatingAgentApiRequest): string {
  const normalizedPrompt = normalizeForIntent(request.prompt);

  const catalogGuard = request.role === "buyer" ? analyzeBuyerCatalogPrompt(normalizedPrompt) : undefined;

  if (request.role === "buyer" && isSellerOnlyPrompt(normalizedPrompt)) {
    return "Bu alıcı panelinde satıcı operasyonu çalıştıramam. Satılmayan ürün, stok, listing veya mağaza analizi için satıcı merkezindeki Agent'ı kullanmalısın.";
  }

  if (request.role === "seller" && isBuyerOnlyPrompt(normalizedPrompt)) {
    return "Bu satıcı panelinde alıcı sepeti hazırlayamam. Sepet veya hediye önerisi için alıcı tarafındaki Agent'ı kullanmalısın.";
  }

  if (catalogGuard && !catalogGuard.ok) {
    return catalogGuard.message ?? createUnsupportedBuyerCatalogAnswer(catalogGuard.unsupportedTerms);
  }

  if (hasUnsupportedBuyerCatalogTerm(answer)) {
    return request.role === "buyer"
      ? "Katalog dışı ürün veya marka uydurmam. Mevcut Alışveriş Arkadaşım ürünlerinden seçim yapabilirim."
      : "Katalog dışı ürün veya marka uydurmam. Mevcut satıcı verileriyle analiz yapabilirim.";
  }

  if (normalizedPrompt.includes("otomatik") || normalizedPrompt.includes("onay")) {
    return request.role === "buyer"
      ? "Hayır. Ürün veya sepet önerisi hazırlayabilirim, fakat onay vermeden sepetini değiştirmem."
      : "Hayır. Analiz ve listing taslağı hazırlayabilirim, fakat onay vermeden mağaza verisini değiştirmem.";
  }

  return answer;
}

function getActionPrompt(
  modelBody: FloatingAgentModelBody,
  fallbackPrompt: string,
  mode: FloatingAgentDecisionMode,
  request: FloatingAgentApiRequest,
): string {
  const normalizedPrompt = normalizeForIntent(fallbackPrompt);

  if (
    (mode === "buyer-agent" && request.role === "buyer" && isBuyerActionPrompt(normalizedPrompt)) ||
    (mode === "seller-agent" && request.role === "seller" && isSellerActionPrompt(normalizedPrompt))
  ) {
    return fallbackPrompt;
  }

  const actionPrompt = modelBody.actionPrompt?.trim();

  return actionPrompt && actionPrompt.length >= 2 ? actionPrompt : fallbackPrompt;
}

function normalizeDecisionModeForRole(mode: FloatingAgentDecisionMode, role: AgentRole): FloatingAgentDecisionMode {
  if (mode === "buyer-agent" && role !== "buyer") {
    return "chat";
  }

  if (mode === "seller-agent" && role !== "seller") {
    return "chat";
  }

  return mode;
}

function resolveFinalDecisionMode(
  modelMode: FloatingAgentDecisionMode,
  request: FloatingAgentApiRequest,
): FloatingAgentDecisionMode {
  const roleSafeMode = normalizeDecisionModeForRole(modelMode, request.role);
  const normalizedPrompt = normalizeForIntent(request.prompt);

  if (isHelpPrompt(normalizedPrompt) || isOutOfScopePrompt(normalizedPrompt)) {
    return "chat";
  }

  if (request.role === "buyer" && (isSellerOnlyPrompt(normalizedPrompt) || !analyzeBuyerCatalogPrompt(normalizedPrompt).ok)) {
    return "chat";
  }

  if (request.role === "seller" && isBuyerOnlyPrompt(normalizedPrompt)) {
    return "chat";
  }

  if (request.role === "buyer" && isBuyerActionPrompt(normalizedPrompt)) {
    return "buyer-agent";
  }

  if (request.role === "seller" && isSellerActionPrompt(normalizedPrompt)) {
    return "seller-agent";
  }

  return roleSafeMode;
}

function normalizeFloatingAgentHistory(rawHistory: unknown): FloatingAgentPromptTurn[] {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory
    .filter(isFloatingAgentPromptTurn)
    .slice(-6)
    .map((turn) => ({
      content: turn.content.slice(0, 360),
      role: turn.role,
    }));
}

function isFloatingAgentPromptTurn(value: unknown): value is FloatingAgentPromptTurn {
  return (
    isRecord(value) &&
    typeof value.content === "string" &&
    (value.role === "assistant" || value.role === "user")
  );
}

function isFloatingAgentDecisionMode(value: string): value is FloatingAgentDecisionMode {
  return value === "buyer-agent" || value === "chat" || value === "clarify" || value === "seller-agent";
}

function isHelpPrompt(prompt: string): boolean {
  return [
    "ne yap",
    "neler yap",
    "nasıl çalış",
    "yardım",
    "help",
    "sss",
    "faq",
    "otomatik",
    "onay",
    "güven",
    "gizlilik",
    "agent nedir",
    "sen kimsin",
  ].some((keyword) => prompt.includes(keyword));
}

function isBuyerActionPrompt(prompt: string): boolean {
  return [
    "öner",
    "oner",
    "sepet",
    "sepete",
    "ürün",
    "urun",
    "hediye",
    "almak",
    "satın",
    "kamera",
    "mikrofon",
    "kulaklık",
    "kargo",
    "teslim",
    "bütçe",
    "tl",
  ].some((keyword) => prompt.includes(keyword));
}

function isSellerActionPrompt(prompt: string): boolean {
  return [
    "stok",
    "satılmayan",
    "satilmayan",
    "iade",
    "yorum",
    "negatif",
    "listing",
    "liste",
    "başlık",
    "baslik",
    "açıklama",
    "aciklama",
    "kampanya",
    "fiyat",
    "ürünlerim",
    "urunlerim",
    "taslak",
  ].some((keyword) => prompt.includes(keyword));
}

function isOutOfScopePrompt(prompt: string): boolean {
  return [
    "hava",
    "maç",
    "mac",
    "borsa",
    "siyaset",
    "haber",
    "şiir",
    "siir",
    "şarkı",
    "sarki",
  ].some((keyword) => prompt.includes(keyword));
}

function isClarificationPrompt(prompt: string): boolean {
  return prompt.length < 12 || ["bakar mısın", "bak", "yardım et", "ne dersin"].includes(prompt);
}

function isSellerOnlyPrompt(prompt: string): boolean {
  return [
    "stok",
    "satılmayan",
    "satilmayan",
    "ürünlerim",
    "urunlerim",
    "mağaza",
    "magaza",
    "listing",
    "listeleme",
    "iade oran",
    "satıcı",
    "satici",
  ].some((keyword) => prompt.includes(keyword));
}

function isBuyerOnlyPrompt(prompt: string): boolean {
  return [
    "anneme",
    "babama",
    "hediye",
    "sepet",
    "sepete",
    "satın al",
    "satin al",
    "almak istiyorum",
  ].some((keyword) => prompt.includes(keyword));
}

function createHelpAnswer(role: AgentRole): string {
  if (role === "buyer") {
    return "Ürünleri, yorum sinyallerini ve teslimat beklentini açıklayabilirim. Sepet hazırlamamı istersen katalogdan öneri çıkarırım; onay vermeden sepetini değiştirmem.";
  }

  return "Satıcı ürünlerinde stok, iade, negatif yorum ve listing iyileştirme fırsatlarını açıklayabilirim. Taslak hazırlasam bile onay vermeden mağaza verisini değiştirmem.";
}

function normalizeForIntent(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
