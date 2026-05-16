import {
  demoSellerId,
  getSellerActionsApiData,
  getSellerProductsApiData,
  sellerActionsEndpoint,
  type SellerActionListItem,
  type SellerActionsFocusKey,
  type SellerProductApiRow,
  type SellerProductLinkedAction,
} from "@/lib/api/seller";
import {
  createAgentRuntimeSnapshot,
  type AgentRuntimeSnapshot,
} from "@/lib/agents/runtime";

export const sellerAgentEndpoint = "/api/seller/agent";

export type SellerAgentFocusKey =
  | SellerActionsFocusKey
  | "at-risk";

export interface SellerAgentExample {
  id: string;
  label: string;
  helper: string;
  prompt: string;
  focus: SellerAgentFocusKey;
}

export interface SellerAgentRequest {
  sellerId?: string;
  prompt: string;
}

export interface SellerAgentApiContractMeta {
  envelope: "success/data/error";
  source: "seller-agent-deterministic-workflow";
  generatedAt: string;
  endpoint: typeof sellerAgentEndpoint;
  method: "POST";
}

export interface SellerAgentApiData {
  contract: SellerAgentApiContractMeta;
  request: Required<SellerAgentRequest>;
  activeFocus: SellerAgentFocusKey;
  message: {
    role: "assistant";
    headline: string;
    content: string;
    safetyNote: string;
  };
  summary: {
    focusLabel: string;
    productCount: number;
    actionCount: number;
    topProductScore: number;
    recommendedOwner: string;
  };
  productFindings: SellerAgentProductFinding[];
  actionSuggestions: SellerAgentActionSuggestion[];
  evidenceSummary: SellerAgentEvidenceItem[];
  nextSteps: SellerAgentNextStep[];
  draftPreview?: SellerAgentDraftPreview;
  source: {
    productsEndpoint: string;
    actionsEndpoint: string;
    routeHint: string;
  };
  runtime: AgentRuntimeSnapshot;
}

export interface SellerAgentProductFinding {
  id: string;
  rank: number;
  score: number;
  product: SellerProductApiRow;
  reason: string;
  evidence: SellerAgentEvidenceItem[];
  linkedAction?: SellerProductLinkedAction;
}

export interface SellerAgentActionSuggestion {
  id: string;
  href: string;
  title: string;
  categoryLabel: string;
  priorityScore: number;
  expectedOutcome: string;
  primaryProduct?: SellerProductApiRow;
}

export interface SellerAgentEvidenceItem {
  label: string;
  value: string;
  helper: string;
  tone: "good" | "calm" | "warning" | "danger";
}

export interface SellerAgentNextStep {
  id: string;
  title: string;
  detail: string;
  href: string;
  ctaLabel: string;
  requiresApproval: boolean;
}

export interface SellerAgentDraftPreview {
  title: string;
  before: string;
  after: string;
  helper: string;
  requiresApproval: true;
}

export interface SellerAgentValidationError {
  ok: false;
  code: string;
  message: string;
  status: number;
}

export interface SellerAgentValidationSuccess {
  ok: true;
  value: Required<SellerAgentRequest>;
}

export type SellerAgentValidationResult =
  | SellerAgentValidationError
  | SellerAgentValidationSuccess;

export const sellerAgentExamples: SellerAgentExample[] = [
  {
    focus: "slow-movers",
    helper: "Satış hızı, dönüşüm ve linked action'a göre sırala",
    id: "slow-movers",
    label: "Satılmayan ürünler",
    prompt: "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
  },
  {
    focus: "negative-reviews",
    helper: "Tekrar eden itirazları ürün ve action ile eşleştir",
    id: "negative-reviews",
    label: "Negatif yorumlar",
    prompt: "Negatif yorum gelen ürünleri grupla, hangi aksiyonu önce yapmalıyım?",
  },
  {
    focus: "stock-risk",
    helper: "Reorder point ve vitrin riskini birlikte göster",
    id: "stock-risk",
    label: "Stok riski",
    prompt: "Stok riski olan ürünleri göster ve bugün ne yapacağımı sırala.",
  },
  {
    focus: "return-risk",
    helper: "İade baskısı, beklenti farkı ve ürün sağlığına bak",
    id: "return-risk",
    label: "İade riski",
    prompt: "İade riski taşıyan ürünlerde hangi açıklama ve operasyon adımı gerekir?",
  },
];

export function getDefaultSellerAgentApiData(): SellerAgentApiData {
  return getSellerAgentApiData({
    prompt: sellerAgentExamples[0].prompt,
    sellerId: demoSellerId,
  });
}

export function validateSellerAgentRequest(rawInput: unknown): SellerAgentValidationResult {
  if (!isRecord(rawInput)) {
    return {
      code: "INVALID_BODY",
      message: "İstek gövdesi JSON object olmalı.",
      ok: false,
      status: 400,
    };
  }

  const prompt = typeof rawInput.prompt === "string" ? rawInput.prompt.trim() : "";

  if (!prompt) {
    return {
      code: "PROMPT_REQUIRED",
      message: "Seller Agent için bir satıcı komutu yazılmalı.",
      ok: false,
      status: 400,
    };
  }

  if (prompt.length > 360) {
    return {
      code: "PROMPT_TOO_LONG",
      message: "Seller Agent komutu en fazla 360 karakter olmalı.",
      ok: false,
      status: 400,
    };
  }

  const sellerId = typeof rawInput.sellerId === "string" && rawInput.sellerId.trim()
    ? rawInput.sellerId.trim()
    : demoSellerId;

  return {
    ok: true,
    value: {
      prompt,
      sellerId,
    },
  };
}

export function getSellerAgentApiData(request: SellerAgentRequest): SellerAgentApiData {
  const normalizedRequest = {
    prompt: request.prompt.trim(),
    sellerId: request.sellerId?.trim() || demoSellerId,
  };
  const activeFocus = inferSellerAgentFocus(normalizedRequest.prompt);
  const productContract = getSellerProductsApiData(normalizedRequest.sellerId);
  const products = productContract?.products ?? [];
  const focusedProducts = filterProductsForAgent(products, activeFocus);
  const actionsFocus = toActionsFocus(activeFocus);
  const actionsContract = getSellerActionsApiData(normalizedRequest.sellerId, { focus: actionsFocus });
  const actionCards = actionsContract?.actionCards ?? [];
  const actionProductIds = new Set(actionCards.flatMap((card) => card.affectedProducts.map((product) => product.id)));
  const actionMatchedProducts = focusedProducts.filter((product) => actionProductIds.has(product.id));
  const candidateProducts = (actionMatchedProducts.length >= 3 ? actionMatchedProducts : focusedProducts).slice(0, 6);
  const productFindings = candidateProducts
    .map((product, index) => createProductFinding(product, index, activeFocus))
    .sort((first, second) => second.score - first.score)
    .slice(0, 4)
    .map((finding, index) => ({ ...finding, rank: index + 1 }));
  const actionSuggestions = actionCards.slice(0, 3).map(createActionSuggestion);
  const topProductScore = productFindings[0]?.score ?? 0;
  const recommendedOwner =
    actionCards[0]?.action.todayChecklist[0]?.owner ??
    productFindings[0]?.linkedAction?.ownerLabel ??
    "operasyon";

  return {
    activeFocus,
    actionSuggestions,
    contract: {
      endpoint: sellerAgentEndpoint,
      envelope: "success/data/error",
      generatedAt: new Date().toISOString(),
      method: "POST",
      source: "seller-agent-deterministic-workflow",
    },
    draftPreview: createDraftPreview(productFindings[0], actionSuggestions[0], activeFocus),
    evidenceSummary: createEvidenceSummary(productFindings, actionSuggestions, activeFocus),
    message: {
      content: createAgentContent(productFindings, actionSuggestions, activeFocus),
      headline: createAgentHeadline(activeFocus),
      role: "assistant",
      safetyNote: "Onay vermeden listeleme, fiyat, kampanya veya stok alanlarında değişiklik yapmam.",
    },
    nextSteps: createNextSteps(productFindings, actionSuggestions, activeFocus),
    productFindings,
    request: normalizedRequest,
    source: {
      actionsEndpoint: actionsFocus === "all" ? sellerActionsEndpoint : `${sellerActionsEndpoint}?focus=${actionsFocus}`,
      productsEndpoint: getProductsEndpoint(activeFocus),
      routeHint: activeFocus === "all" ? "/seller/actions" : `/seller/actions?focus=${actionsFocus}`,
    },
    runtime: createAgentRuntimeSnapshot({
      actorId: normalizedRequest.sellerId,
      prompt: normalizedRequest.prompt,
      role: "seller",
      routeContext: "/seller/agent",
      surface: "route",
    }),
    summary: {
      actionCount: actionSuggestions.length,
      focusLabel: getSellerAgentFocusLabel(activeFocus),
      productCount: productFindings.length,
      recommendedOwner,
      topProductScore,
    },
  };
}

function inferSellerAgentFocus(prompt: string): SellerAgentFocusKey {
  const normalizedPrompt = prompt.toLocaleLowerCase("tr-TR");

  if (/(satılmayan|satilmayan|yavaş|yavas|slow|dönüşüm|donusum|satış hızı|satis hizi)/u.test(normalizedPrompt)) {
    return "slow-movers";
  }

  if (/(negatif|yorum|şikayet|sikayet|puan|müşteri sesi|musteri sesi)/u.test(normalizedPrompt)) {
    return "negative-reviews";
  }

  if (/(stok|tedarik|reorder|kritik stok)/u.test(normalizedPrompt)) {
    return "stock-risk";
  }

  if (/(iade|return|beklenti)/u.test(normalizedPrompt)) {
    return "return-risk";
  }

  if (/(listeleme|başlık|baslik|açıklama|aciklama|pdp|içerik|icerik)/u.test(normalizedPrompt)) {
    return "content";
  }

  if (/(marj|kâr|kar|maliyet|fiyat|karlılık|karlilik)/u.test(normalizedPrompt)) {
    return "profitability";
  }

  if (/(risk|öncelik|oncelik|sırala|sirala)/u.test(normalizedPrompt)) {
    return "at-risk";
  }

  return "all";
}

function filterProductsForAgent(
  products: SellerProductApiRow[],
  focus: SellerAgentFocusKey,
): SellerProductApiRow[] {
  if (focus === "all") {
    return products
      .slice()
      .sort((first, second) => getProductAgentScore(second, focus) - getProductAgentScore(first, focus));
  }

  if (focus === "content" || focus === "profitability") {
    return products
      .filter((product) => product.linkedAction)
      .sort((first, second) => getProductAgentScore(second, focus) - getProductAgentScore(first, focus));
  }

  return products
    .filter((product) => product.focusTags.includes(focus as never))
    .sort((first, second) => getProductAgentScore(second, focus) - getProductAgentScore(first, focus));
}

function toActionsFocus(focus: SellerAgentFocusKey): SellerActionsFocusKey {
  if (focus === "at-risk") {
    return "all";
  }

  return focus;
}

function createProductFinding(
  product: SellerProductApiRow,
  index: number,
  focus: SellerAgentFocusKey,
): SellerAgentProductFinding {
  const primarySignal = product.riskSignals[0];

  return {
    evidence: [
      {
        helper: product.healthLabel,
        label: "Sağlık",
        tone: product.healthScore < 70 ? "danger" : "calm",
        value: `${product.healthScore}/100`,
      },
      {
        helper: `${product.reorderPoint} adet eşik`,
        label: "Stok",
        tone: product.stockStatus === "risk" ? "danger" : product.stockStatus === "watch" ? "warning" : "good",
        value: `${product.availableStock} adet`,
      },
      {
        helper: `${formatTryCompact(product.revenue30d)} gelir`,
        label: "Satış",
        tone: product.orders30d < 12 ? "warning" : "calm",
        value: `${product.orders30d} sipariş`,
      },
    ],
    id: product.id,
    linkedAction: product.linkedAction,
    product,
    rank: index + 1,
    reason: createProductReason(product, focus, primarySignal?.label),
    score: getProductAgentScore(product, focus),
  };
}

function createActionSuggestion(card: SellerActionListItem): SellerAgentActionSuggestion {
  return {
    categoryLabel: card.action.categoryLabel,
    expectedOutcome: card.action.expectedOutcome,
    href: card.href,
    id: card.id,
    primaryProduct: card.primaryProduct,
    priorityScore: card.action.priorityScore,
    title: card.action.title,
  };
}

function createEvidenceSummary(
  findings: SellerAgentProductFinding[],
  actions: SellerAgentActionSuggestion[],
  focus: SellerAgentFocusKey,
): SellerAgentEvidenceItem[] {
  const averageHealth = findings.length > 0
    ? Math.round(findings.reduce((sum, finding) => sum + finding.product.healthScore, 0) / findings.length)
    : 0;
  const totalRevenue = findings.reduce((sum, finding) => sum + finding.product.revenue30d, 0);

  return [
    {
      helper: `${findings.length} ürün Agent sıralamasında`,
      label: getSellerAgentFocusLabel(focus),
      tone: focus === "all" ? "calm" : "warning",
      value: String(findings.length),
    },
    {
      helper: "İlk 4 ürünün ortalaması",
      label: "Sağlık",
      tone: averageHealth < 70 ? "danger" : "calm",
      value: `${averageHealth}/100`,
    },
    {
      helper: "Bağlı seller action sayısı",
      label: "Aksiyon",
      tone: actions.length > 0 ? "good" : "warning",
      value: String(actions.length),
    },
    {
      helper: "Görünür ticari hacim",
      label: "Gelir",
      tone: "calm",
      value: formatTryCompact(totalRevenue),
    },
  ];
}

function createNextSteps(
  findings: SellerAgentProductFinding[],
  actions: SellerAgentActionSuggestion[],
  focus: SellerAgentFocusKey,
): SellerAgentNextStep[] {
  const primaryFinding = findings[0];
  const primaryAction = actions[0];

  return [
    {
      ctaLabel: "Ürünleri filtrele",
      detail: `${getSellerAgentFocusLabel(focus)} görünümünde ilgili ürün satırlarını aç.`,
      href: getProductsHref(focus),
      id: "open-products",
      requiresApproval: false,
      title: "Ürün kanıtını aç",
    },
    {
      ctaLabel: "Aksiyon detayını aç",
      detail: primaryAction?.expectedOutcome ?? "En yüksek öncelikli seller action detayını incele.",
      href: primaryAction?.href ?? "/seller/actions",
      id: "open-action",
      requiresApproval: false,
      title: primaryAction?.title ?? "Aksiyon kuyruğunu aç",
    },
    {
      ctaLabel: "Önizleme beklemede",
      detail: primaryFinding
        ? `${primaryFinding.product.name} için before/after listeleme taslağı üretilebilir, fakat onay olmadan uygulanmaz.`
        : "Mutation taslağı yalnızca ürün ve action kanıtı oluştuktan sonra hazırlanır.",
      href: "/seller/profile",
      id: "approval-boundary",
      requiresApproval: true,
      title: "Onay sınırını koru",
    },
  ];
}

function createDraftPreview(
  finding: SellerAgentProductFinding | undefined,
  action: SellerAgentActionSuggestion | undefined,
  focus: SellerAgentFocusKey,
): SellerAgentDraftPreview | undefined {
  if (!finding) {
    return undefined;
  }

  return {
    after: `${finding.product.name}: ${getSellerAgentFocusLabel(focus)} sinyali ürün sayfasında açık, ölçülebilir ve alıcı itirazını önden karşılayan bir metne çevrilir.`,
    before: `${finding.product.name}: ${finding.product.healthLabel}. ${finding.product.riskSignals[0]?.helper ?? "Risk sinyali izleniyor."}`,
    helper: action
      ? `${action.title} aksiyonuna bağlı taslak; uygulama onay gerektirir.`
      : "Aksiyon bulunursa taslak seller action detayına bağlanır.",
    requiresApproval: true,
    title: "Onaylı mutation önizlemesi",
  };
}

function createAgentHeadline(focus: SellerAgentFocusKey): string {
  if (focus === "all") {
    return "Öncelikli satıcı işlerini ürün kanıtıyla sıraladım.";
  }

  return `${getSellerAgentFocusLabel(focus)} için ilk sıradaki ürünleri ayırdım.`;
}

function createAgentContent(
  findings: SellerAgentProductFinding[],
  actions: SellerAgentActionSuggestion[],
  focus: SellerAgentFocusKey,
): string {
  const firstProduct = findings[0]?.product.name ?? "ilgili ürün";
  const actionTitle = actions[0]?.title ?? "aksiyon kuyruğu";

  if (findings.length === 0) {
    return "Bu komut için yeterli ürün kanıtı bulamadım. Ürünler veya aksiyonlar sayfasından daha dar bir kategori seçebilirsin.";
  }

  return `${getSellerAgentFocusLabel(focus)} görünümünde ${findings.length} ürünü sağlık, stok, satış ve yorum sinyaliyle sıraladım. İlk aday ${firstProduct}; bağlı öneri ${actionTitle}.`;
}

function createProductReason(
  product: SellerProductApiRow,
  focus: SellerAgentFocusKey,
  signalLabel?: string,
): string {
  if (focus === "slow-movers") {
    return `${product.orders30d} sipariş ve ${formatPercent(product.conversionRate)} dönüşüm, satış hızının baskılandığını gösteriyor.`;
  }

  if (focus === "negative-reviews") {
    return `${product.reviewCount} yorum ve ${product.ratingAverage.toFixed(1)} puan, müşteri itirazının görünür olduğunu gösteriyor.`;
  }

  if (focus === "stock-risk") {
    return `${product.availableStock}/${product.reorderPoint} stok seviyesi vitrin baskısı büyümeden aksiyon gerektiriyor.`;
  }

  if (focus === "return-risk") {
    return `${signalLabel ?? "İade riski"} ürün sayfası ve operasyon beklentisinin netleşmesi gerektiğini gösteriyor.`;
  }

  if (focus === "content") {
    return `${product.healthLabel}; listeleme metni ürün risk sinyalini yeterince karşılamıyor.`;
  }

  if (focus === "profitability") {
    return `${formatTryCompact(product.revenue30d)} gelir hacmi marj ve kampanya kararının kontrollü verilmesini gerektiriyor.`;
  }

  return `${signalLabel ?? product.stockStatusLabel} ve ${product.healthScore}/100 sağlık skoru ürünü Agent sıralamasında öne çıkarıyor.`;
}

function getProductAgentScore(product: SellerProductApiRow, focus: SellerAgentFocusKey): number {
  const healthRisk = 100 - product.healthScore;
  const signalWeight = product.riskSignals.length * 8;
  const actionWeight = product.linkedAction ? Math.round(product.linkedAction.priorityScore / 5) : 0;
  const stockWeight = focus === "stock-risk" && product.focusTags.includes("stock-risk") ? 18 : 0;
  const reviewWeight = focus === "negative-reviews" ? Math.min(18, product.reviewCount / 4) : 0;
  const slowMoverWeight = focus === "slow-movers" ? Math.max(0, 18 - product.orders30d) : 0;

  return Math.round(healthRisk + signalWeight + actionWeight + stockWeight + reviewWeight + slowMoverWeight);
}

function getSellerAgentFocusLabel(focus: SellerAgentFocusKey): string {
  const labels: Record<SellerAgentFocusKey, string> = {
    all: "Genel öncelik",
    "at-risk": "Riskli ürünler",
    campaign: "Kampanya",
    content: "Listeleme",
    "customer-voice": "Müşteri sesi",
    growth: "Büyüme",
    inventory: "Stok",
    "negative-reviews": "Negatif yorum",
    operations: "Operasyon",
    profitability: "Kârlılık",
    "return-risk": "İade riski",
    returns: "İade",
    "slow-movers": "Satılmayan ürünler",
    "stock-risk": "Stok riski",
  };

  return labels[focus];
}

function getProductsEndpoint(focus: SellerAgentFocusKey): string {
  if (focus === "all" || focus === "content" || focus === "profitability") {
    return "/api/seller/products";
  }

  if (focus === "inventory") {
    return "/api/seller/products?focus=stock-risk";
  }

  return `/api/seller/products?focus=${focus}`;
}

function getProductsHref(focus: SellerAgentFocusKey): string {
  return getProductsEndpoint(focus).replace("/api", "");
}

function formatTryCompact(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    compactDisplay: "short",
    currency: "TRY",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
