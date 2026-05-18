import { buyerSmartCartExamples, getBuyerSmartCartApiData } from "@/lib/api/buyer";
import {
  getBuyerCatalogApiData,
  type BuyerCatalogImage,
} from "@/lib/api/buyer-catalog";
import { analyzeProductHealthWorkflow, generateSellerActionsWorkflow } from "@/lib/workflows";
import type {
  BuyerSellerSignalCandidate,
  ProductHealthWorkflowResult,
  SellerActionCategory,
  SellerActionOwner,
  SellerActionType,
  SellerGrowthAction,
} from "@/lib/workflows";
import { getProductById, getProductBySlug, getProductDetail, getReviewsByProductId, getSellerOverview } from "@/lib/data";
import { scoreProduct } from "@/lib/scoring";
import type { Product, ProductCategory, Review, ReviewSentiment, ReviewTheme } from "@/types/commerce";

export const demoSellerId = "seller-commercepilot";
export const sellerActionsEndpoint = "/api/seller/actions";
export const sellerBuyerSignalsEndpoint = "/api/seller/buyer-signals";

export interface SellerApiContractMeta {
  envelope: "success/data/error";
  source: "mock-workflow" | "buyer-smart-cart-workflow";
  generatedAt: string;
  sellerId: string;
}

export interface SellerBuyerSignalsApiContractMeta extends SellerApiContractMeta {
  source: "buyer-smart-cart-workflow";
  endpoint: typeof sellerBuyerSignalsEndpoint;
  method: "GET";
}

export interface SellerActionDetailApiContractMeta extends SellerApiContractMeta {
  source: "mock-workflow";
  endpoint: string;
  method: "GET";
  actionId: string;
}

export interface SellerSummaryApiData {
  id: string;
  name: string;
  displayName: string;
  rating: number;
  supportResponseHours: number;
  defaultDeliveryPromiseDays: number;
}

export interface SellerOverviewApiData {
  contract: SellerApiContractMeta;
  seller: SellerSummaryApiData;
  stats: {
    analyzedProductCount: number;
    totalRevenue30d: number;
    totalOrders30d: number;
    lowStockProductCount: number;
    attentionActionCount: number;
    reviewAttentionCount: number;
  };
  alertCards: SellerOverviewAlertCard[];
  topActions: SellerGrowthAction[];
  operationSignals: SellerOperationSignal[];
  priorityQueue: SellerOverviewPriorityItem[];
}

export interface SellerOperationSignal {
  id: string;
  categoryLabel: string;
  title: string;
  value: string;
  helper: string;
  tone: "good" | "calm" | "warning";
}

export type SellerOverviewAlertId =
  | "negative_reviews"
  | "return_risk"
  | "slow_movers"
  | "stock_risk";

export interface SellerOverviewAlertCard {
  id: SellerOverviewAlertId;
  title: string;
  value: string;
  summary: string;
  href: string;
  apiEndpoint: string;
  ownerLabel: SellerActionOwner;
  tone: "calm" | "danger" | "warning";
  productCount: number;
  actionCount: number;
  primaryProduct?: SellerProductApiRow;
  primaryAction?: {
    id: string;
    title: string;
    href: string;
    priorityScore: number;
    timeHorizonLabel: string;
  };
  evidence: SellerOverviewAlertEvidence[];
}

export interface SellerOverviewAlertEvidence {
  label: string;
  value: string;
  helper: string;
}

export interface SellerOverviewPriorityItem {
  id: string;
  title: string;
  href: string;
  ownerLabel: SellerActionOwner;
  priorityScore: number;
  helper: string;
  tone: "calm" | "danger" | "warning";
}

export interface SellerActionsApiContractMeta extends SellerApiContractMeta {
  source: "mock-workflow";
  endpoint: string;
  method: "GET";
  activeFocus: SellerActionsFocusKey;
}

export interface SellerActionsApiData {
  contract: SellerActionsApiContractMeta;
  seller: SellerSummaryApiData;
  activeFocus: SellerActionsFocusKey;
  actions: SellerGrowthAction[];
  actionCards: SellerActionListItem[];
  segments: SellerActionsSegment[];
  categoryRoutes: SellerActionsSegment[];
  analyzedProductCount: number;
  actionTypeCoverage: string[];
  summary: {
    actionCount: number;
    visibleActionCount: number;
    categoryCount: number;
    affectedProductCount: number;
    criticalActionCount: number;
    topPriorityScore: number;
  };
}

export type SellerActionsFocusKey =
  | "all"
  | "inventory"
  | "operations"
  | "content"
  | "customer-voice"
  | "returns"
  | "campaign"
  | "growth"
  | "profitability"
  | "stock-risk"
  | "negative-reviews"
  | "return-risk"
  | "slow-movers";

export interface SellerActionsSegment {
  id: SellerActionsFocusKey;
  label: string;
  helper: string;
  actionCount: number;
  productCount: number;
  href: string;
  apiEndpoint: string;
  kind: "all" | "category" | "risk";
  tone: "calm" | "danger" | "warning";
  ownerLabel: SellerActionOwner;
}

export interface SellerActionListItem {
  id: string;
  href: string;
  action: SellerGrowthAction;
  affectedProducts: SellerProductApiRow[];
  primaryProduct?: SellerProductApiRow;
  focusTags: SellerActionsFocusKey[];
  evidence: SellerActionListEvidence[];
}

export interface SellerActionListEvidence {
  label: string;
  value: string;
  helper: string;
  tone: "good" | "calm" | "warning";
}

export interface SellerActionDetailApiData {
  contract: SellerActionDetailApiContractMeta;
  seller: SellerSummaryApiData;
  action: SellerGrowthAction;
  actionHref: string;
  affectedProducts: SellerProductApiRow[];
  relatedBuyerSignals: SellerBuyerSignalApiRow[];
  reviewHighlights: SellerActionReviewHighlight[];
  executionPreview: SellerActionExecutionPreview;
  evidenceSnapshot: SellerActionEvidenceSnapshot[];
  llmReadyContext: SellerGrowthAction["llmReadyContext"];
}

export interface SellerActionReviewHighlight {
  id: string;
  body: string;
  createdAt: string;
  needsSellerAttention: boolean;
  rating: number;
  sentiment: ReviewSentiment;
  sentimentLabel: string;
  themeLabels: string[];
  title: string;
}

export interface SellerActionExecutionPreview {
  title: string;
  summary: string;
  primaryOwner: SellerActionOwner;
  steps: SellerActionExecutionStep[];
  generatedDrafts: SellerActionGeneratedDraft[];
}

export interface SellerActionExecutionStep {
  id: string;
  title: string;
  detail: string;
  owner: SellerActionOwner;
  priorityLabel: string;
}

export interface SellerActionGeneratedDraft {
  label: string;
  body: string;
  helper: string;
}

export interface SellerActionEvidenceSnapshot {
  label: string;
  value: string;
  helper: string;
  tone: "good" | "calm" | "warning";
}

export interface SellerProductsApiData {
  contract: SellerApiContractMeta;
  seller: SellerSummaryApiData;
  activeFocus: SellerProductsFocusKey;
  products: SellerProductApiRow[];
  segments: SellerProductsSegment[];
  categoryBreakdown: SellerProductCategoryBreakdown[];
  spotlightProduct?: SellerProductApiRow;
  summary: {
    productCount: number;
    visibleProductCount: number;
    averageHealthScore: number;
    lowStockProductCount: number;
    riskyProductCount: number;
    categoryCount: number;
  };
}

export type SellerProductsFocusKey =
  | "all"
  | "at-risk"
  | "negative-reviews"
  | "return-risk"
  | "slow-movers"
  | "stock-risk";

export interface SellerProductsSegment {
  id: SellerProductsFocusKey;
  label: string;
  helper: string;
  productCount: number;
  href: string;
  apiEndpoint: string;
}

export interface SellerProductCategoryBreakdown {
  category: ProductCategory;
  label: string;
  productCount: number;
  riskCount: number;
  averageHealthScore: number;
  revenue30d: number;
}

export interface SellerProductApiRow {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  categoryLabel: string;
  subcategory: string;
  price: number;
  currency: "TRY";
  availableStock: number;
  reorderPoint: number;
  stockStatus: "safe" | "watch" | "risk";
  stockStatusLabel: string;
  healthScore: number;
  healthLabel: string;
  orders30d: number;
  revenue30d: number;
  conversionRate: number;
  ratingAverage: number;
  reviewCount: number;
  demoStoryFlags: string[];
  image: BuyerCatalogImage;
  focusTags: SellerProductsFocusKey[];
  riskSignals: SellerProductRiskSignal[];
  linkedAction?: SellerProductLinkedAction;
  href: string;
  apiHealthEndpoint: string;
}

export type SellerProductRiskSignalId =
  | "listing-gap"
  | "margin-watch"
  | "negative-reviews"
  | "return-risk"
  | "slow-movers"
  | "stock-risk";

export interface SellerProductRiskSignal {
  id: SellerProductRiskSignalId;
  label: string;
  helper: string;
  tone: "calm" | "danger" | "warning";
}

export interface SellerProductLinkedAction {
  id: string;
  title: string;
  href: string;
  type: SellerActionType;
  priorityScore: number;
  ownerLabel: SellerActionOwner;
  timeHorizonLabel: string;
}

export interface SellerProductHealthApiData {
  contract: SellerApiContractMeta;
  product: SellerProductApiRow;
  scorecard: ProductHealthWorkflowResult["scorecard"];
  topInsights: ProductHealthWorkflowResult["topInsights"];
  relatedProducts: SellerProductApiRow[];
  relatedActions: SellerGrowthAction[];
  evidenceSnapshot: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
}

export interface SellerBuyerSignalsApiData {
  contract: SellerBuyerSignalsApiContractMeta;
  seller: SellerSummaryApiData;
  summary: {
    promptCount: number;
    signalCount: number;
    affectedProductCount: number;
    highPrioritySignalCount: number;
    averagePriorityScore: number;
    typeCoverage: SellerBuyerSignalTypeCoverage[];
  };
  loopNarrative: string;
  promptSnapshots: SellerBuyerSignalPromptSnapshot[];
  signals: SellerBuyerSignalApiRow[];
}

export interface SellerBuyerSignalTypeCoverage {
  type: BuyerSellerSignalCandidate["type"];
  label: string;
  count: number;
}

export interface SellerBuyerSignalPromptSnapshot {
  id: string;
  label: string;
  helper: string;
  buyerId: string;
  buyerName?: string;
  prompt: string;
  intentLabel: string;
  confidenceScore: number;
  totalPrice: number;
  signalCount: number;
  selectedProductNames: string[];
}

export interface SellerBuyerSignalApiRow {
  id: string;
  type: BuyerSellerSignalCandidate["type"];
  typeLabel: string;
  sourceExampleId: string;
  sourcePrompt: string;
  buyerId: string;
  buyerName?: string;
  intentLabel: string;
  summary: string;
  priorityScore: number;
  priorityLabel: string;
  affectedProducts: SellerBuyerSignalProductSummary[];
  sellerActionHint: string;
  matchedSellerActions: SellerBuyerSignalMatchedAction[];
  evidence: Record<string, unknown>;
}

export interface SellerBuyerSignalProductSummary {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  healthScore: number;
  stockStatusLabel: string;
  href: string;
}

export interface SellerBuyerSignalMatchedAction {
  id: string;
  title: string;
  priorityScore: number;
  timeHorizonLabel: string;
}

const sellerProductsFocusKeys = new Set<SellerProductsFocusKey>([
  "all",
  "at-risk",
  "negative-reviews",
  "return-risk",
  "slow-movers",
  "stock-risk",
]);

const sellerProductsFocusAliases: Record<string, SellerProductsFocusKey> = {
  negative_reviews: "negative-reviews",
  "negative-review": "negative-reviews",
  return_risk: "return-risk",
  "return-risk-products": "return-risk",
  risk: "at-risk",
  slow_mover: "slow-movers",
  slow_movers: "slow-movers",
  "slow-mover": "slow-movers",
  stock_risk: "stock-risk",
};

const sellerActionCategoryFocusMap: Record<SellerActionCategory, SellerActionsFocusKey> = {
  campaign: "campaign",
  content: "content",
  customer_voice: "customer-voice",
  growth: "growth",
  inventory: "inventory",
  operations: "operations",
  profitability: "profitability",
  returns: "returns",
};

const sellerActionFocusCategoryMap: Partial<Record<SellerActionsFocusKey, SellerActionCategory>> = {
  campaign: "campaign",
  content: "content",
  "customer-voice": "customer_voice",
  growth: "growth",
  inventory: "inventory",
  operations: "operations",
  profitability: "profitability",
  returns: "returns",
};

const sellerActionsFocusKeys = new Set<SellerActionsFocusKey>([
  "all",
  "inventory",
  "operations",
  "content",
  "customer-voice",
  "returns",
  "campaign",
  "growth",
  "profitability",
  "stock-risk",
  "negative-reviews",
  "return-risk",
  "slow-movers",
]);

const sellerActionsFocusAliases: Record<string, SellerActionsFocusKey> = {
  customer_voice: "customer-voice",
  "customer-voices": "customer-voice",
  "musteri-sesi": "customer-voice",
  negative_reviews: "negative-reviews",
  "negative-review": "negative-reviews",
  "negatif-yorum": "negative-reviews",
  "negatif-yorumlar": "negative-reviews",
  return_risk: "return-risk",
  "return-risk-products": "return-risk",
  "iade-riski": "return-risk",
  slow_mover: "slow-movers",
  slow_movers: "slow-movers",
  "slow-mover": "slow-movers",
  "satilmayan": "slow-movers",
  "satilmayan-urunler": "slow-movers",
  stock_risk: "stock-risk",
  "stok-riski": "stock-risk",
  review_attention: "negative-reviews",
  reduce_return_risk: "return-risk",
  restock: "stock-risk",
};

const sellerActionFocusOrder: SellerActionsFocusKey[] = [
  "all",
  "stock-risk",
  "negative-reviews",
  "return-risk",
  "slow-movers",
  "inventory",
  "customer-voice",
  "returns",
  "content",
  "campaign",
  "growth",
  "operations",
  "profitability",
];

const sellerActionSegmentMeta: Record<
  SellerActionsFocusKey,
  { label: string; helper: string; kind: SellerActionsSegment["kind"]; ownerLabel: SellerActionOwner; tone: SellerActionsSegment["tone"] }
> = {
  all: {
    helper: "Tüm workflow aksiyonları",
    kind: "all",
    label: "Tümü",
    ownerLabel: "operasyon",
    tone: "calm",
  },
  campaign: {
    helper: "Bundle ve kampanya kurguları",
    kind: "category",
    label: "Kampanya",
    ownerLabel: "pazarlama",
    tone: "calm",
  },
  content: {
    helper: "Listeleme ve PDP düzeni",
    kind: "category",
    label: "İçerik",
    ownerLabel: "icerik",
    tone: "warning",
  },
  "customer-voice": {
    helper: "Yorum ve destek itirazları",
    kind: "category",
    label: "Müşteri sesi",
    ownerLabel: "destek",
    tone: "danger",
  },
  growth: {
    helper: "Kazanan ürünü büyüt",
    kind: "category",
    label: "Büyüme",
    ownerLabel: "pazarlama",
    tone: "calm",
  },
  inventory: {
    helper: "Stok ve tedarik riski",
    kind: "category",
    label: "Stok",
    ownerLabel: "stok",
    tone: "danger",
  },
  "negative-reviews": {
    helper: "Negatif yorum aksiyonları",
    kind: "risk",
    label: "Negatif yorum",
    ownerLabel: "destek",
    tone: "danger",
  },
  operations: {
    helper: "Operasyon baskısı",
    kind: "category",
    label: "Operasyon",
    ownerLabel: "operasyon",
    tone: "warning",
  },
  profitability: {
    helper: "Marj ve finans koruması",
    kind: "category",
    label: "Kârlılık",
    ownerLabel: "finans",
    tone: "warning",
  },
  "return-risk": {
    helper: "İade riski aksiyonları",
    kind: "risk",
    label: "İade riski",
    ownerLabel: "operasyon",
    tone: "warning",
  },
  returns: {
    helper: "İade ve beklenti yönetimi",
    kind: "category",
    label: "İade",
    ownerLabel: "operasyon",
    tone: "warning",
  },
  "slow-movers": {
    helper: "Satış hızı düşük aksiyonlar",
    kind: "risk",
    label: "Satılmayan",
    ownerLabel: "pazarlama",
    tone: "warning",
  },
  "stock-risk": {
    helper: "Stok açığı ve vitrin koruması",
    kind: "risk",
    label: "Stok riski",
    ownerLabel: "stok",
    tone: "danger",
  },
};

const productCategoryLabels: Record<ProductCategory, string> = {
  aksesuar: "Aksesuar",
  "elektronik-aksesuar": "Elektronik",
  "erkek-giyim": "Erkek Giyim",
  "ev-ofis": "Ev & Yaşam",
  "hediye-yasam-tarzi": "Aksesuar",
  "kahve-ekipmanlari": "Ev & Yaşam",
  "kadin-giyim": "Kadın Giyim",
  kozmetik: "Kozmetik",
  "kucuk-ev-yasam": "Ev & Yaşam",
  "masa-calisma-alani": "Ev & Yaşam",
  spor: "Spor",
};

const sellerProductSegmentMeta: Record<
  SellerProductsFocusKey,
  { label: string; helper: string }
> = {
  all: {
    label: "Tümü",
    helper: "Tüm aktif SKU",
  },
  "at-risk": {
    label: "Riskli",
    helper: "Skor veya sinyal var",
  },
  "negative-reviews": {
    label: "Yorum",
    helper: "Destek yanıtı gerekir",
  },
  "return-risk": {
    label: "İade",
    helper: "Beklenti farkı var",
  },
  "slow-movers": {
    label: "Satılmayan",
    helper: "Satış hızı düşük",
  },
  "stock-risk": {
    label: "Stok",
    helper: "Eşik altında",
  },
};

export function normalizeSellerProductsFocus(
  value?: string | string[] | null,
): SellerProductsFocusKey {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim().toLowerCase();

  if (!normalizedValue) {
    return "all";
  }

  const aliasedValue = sellerProductsFocusAliases[normalizedValue] ?? normalizedValue;

  return sellerProductsFocusKeys.has(aliasedValue as SellerProductsFocusKey)
    ? (aliasedValue as SellerProductsFocusKey)
    : "all";
}

export function resolveSellerActionsFocus(
  value?: string | string[] | null,
): SellerActionsFocusKey | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim().toLowerCase();

  if (!normalizedValue) {
    return undefined;
  }

  const hyphenatedValue = normalizedValue.replaceAll("_", "-");
  const aliasedValue =
    sellerActionsFocusAliases[normalizedValue] ??
    sellerActionsFocusAliases[hyphenatedValue] ??
    hyphenatedValue;

  return sellerActionsFocusKeys.has(aliasedValue as SellerActionsFocusKey)
    ? (aliasedValue as SellerActionsFocusKey)
    : undefined;
}

export function normalizeSellerActionsFocus(
  value?: string | string[] | null,
): SellerActionsFocusKey {
  return resolveSellerActionsFocus(value) ?? "all";
}

export function getSellerOverviewApiData(sellerId = demoSellerId): SellerOverviewApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);

  if (!overview || !workflow) {
    return undefined;
  }

  const products = overview.products.map((product) => createSellerProductRow(product, workflow.actions));
  const lowStockProducts = products.filter((product) => product.stockStatus === "risk");
  const attentionActions = workflow.actions.filter((action) => action.timeHorizon === "today");
  const reviewAttentionCount = workflow.actions.filter((action) => action.type === "review_attention").length;
  const alertCards = createSellerOverviewAlertCards(products, workflow.actions);

  return {
    contract: createContractMeta(sellerId, workflow.generatedAt),
    seller: createSellerSummary(overview.seller),
    stats: {
      analyzedProductCount: workflow.analyzedProductCount,
      totalRevenue30d: Math.round(overview.products.reduce((sum, product) => sum + product.metrics.revenue30d, 0)),
      totalOrders30d: overview.products.reduce((sum, product) => sum + product.metrics.orders30d, 0),
      lowStockProductCount: lowStockProducts.length,
      attentionActionCount: attentionActions.length,
      reviewAttentionCount,
    },
    alertCards,
    topActions: workflow.actions,
    operationSignals: workflow.actions.slice(0, 3).map((action) => ({
      id: action.id,
      categoryLabel: action.categoryLabel,
      title: action.title,
      value: action.metricHighlights[0]?.value ?? `${action.priorityScore}/100`,
      helper: action.metricHighlights[0]?.label ?? action.timeHorizonLabel,
      tone: action.urgency === "critical" ? "warning" : action.urgency === "high" ? "calm" : "good",
    })),
    priorityQueue: createSellerOverviewPriorityQueue(alertCards, workflow.actions),
  };
}

export function getSellerActionsApiData(
  sellerId = demoSellerId,
  options: { focus?: string | string[] | null } = {},
): SellerActionsApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);

  if (!overview || !workflow) {
    return undefined;
  }

  const activeFocus = normalizeSellerActionsFocus(options.focus);
  const allActionCards = workflow.actions.map((action) =>
    createSellerActionListItem(action, overview.products, workflow.actions),
  );
  const actionCards = filterSellerActionCardsByFocus(allActionCards, activeFocus);
  const segments = createSellerActionSegments(allActionCards);
  const affectedProductCount = new Set(allActionCards.flatMap((card) => card.affectedProducts.map((product) => product.id))).size;
  const categoryCount = new Set(allActionCards.map((card) => card.action.category)).size;
  const topPriorityScore = allActionCards.reduce(
    (maxPriority, card) => Math.max(maxPriority, card.action.priorityScore),
    0,
  );

  return {
    contract: {
      ...createContractMeta(sellerId, workflow.generatedAt, "mock-workflow"),
      activeFocus,
      endpoint: activeFocus === "all" ? sellerActionsEndpoint : `${sellerActionsEndpoint}?focus=${activeFocus}`,
      method: "GET",
      source: "mock-workflow",
    },
    seller: createSellerSummary(overview.seller),
    activeFocus,
    actions: actionCards.map((card) => card.action),
    actionCards,
    segments,
    categoryRoutes: segments.filter((segment) => segment.kind === "category"),
    analyzedProductCount: workflow.analyzedProductCount,
    actionTypeCoverage: Array.from(new Set(workflow.actions.map((action) => action.type))),
    summary: {
      actionCount: allActionCards.length,
      affectedProductCount,
      categoryCount,
      criticalActionCount: allActionCards.filter((card) => card.action.urgency === "critical").length,
      topPriorityScore,
      visibleActionCount: actionCards.length,
    },
  };
}

export function getSellerActionDetailApiData(
  actionId: string,
  sellerId = demoSellerId,
): SellerActionDetailApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);

  if (!overview || !workflow) {
    return undefined;
  }

  const action = workflow.actions.find((candidate) => candidate.id === actionId);

  if (!action) {
    return undefined;
  }

  const sellerProductIds = new Set(overview.products.map((product) => product.id));
  const affectedProducts = action.productIds
    .filter((productId) => sellerProductIds.has(productId))
    .map((productId) => getProductById(productId))
    .filter((product): product is Product => Boolean(product))
    .map((product) => createSellerProductRow(product, workflow.actions));
  const relatedBuyerSignals =
    getSellerBuyerSignalsApiData(sellerId)?.signals
      .filter((signal) => isBuyerSignalRelatedToAction(signal, action))
      .slice(0, 4) ?? [];
  const reviewHighlights = createSellerActionReviewHighlights(action, affectedProducts);

  return {
    contract: {
      ...createContractMeta(sellerId, workflow.generatedAt, "mock-workflow"),
      actionId: action.id,
      endpoint: `${sellerActionsEndpoint}/${action.id}`,
      method: "GET",
      source: "mock-workflow",
    },
    seller: createSellerSummary(overview.seller),
    action,
    actionHref: `/seller/actions/${action.id}`,
    affectedProducts,
    relatedBuyerSignals,
    reviewHighlights,
    executionPreview: createSellerActionExecutionPreview(action, affectedProducts, relatedBuyerSignals),
    evidenceSnapshot: createSellerActionEvidenceSnapshot(action, affectedProducts, relatedBuyerSignals),
    llmReadyContext: action.llmReadyContext,
  };
}

export function getSellerProductsApiData(
  sellerId = demoSellerId,
  options: { focus?: string | string[] | null } = {},
): SellerProductsApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);

  if (!overview || !workflow) {
    return undefined;
  }

  const allProducts = overview.products.map((product) => createSellerProductRow(product, workflow.actions));
  const activeFocus = normalizeSellerProductsFocus(options.focus);
  const products = filterSellerProductsByFocus(allProducts, activeFocus);
  const averageHealthScore =
    allProducts.length > 0
      ? Math.round(allProducts.reduce((sum, product) => sum + product.healthScore, 0) / allProducts.length)
      : 0;
  const riskyProductCount = allProducts.filter((product) => product.focusTags.includes("at-risk")).length;
  const lowStockProductCount = allProducts.filter((product) => product.focusTags.includes("stock-risk")).length;
  const categoryCount = new Set(allProducts.map((product) => product.category)).size;

  return {
    contract: createContractMeta(sellerId, workflow.generatedAt),
    seller: createSellerSummary(overview.seller),
    activeFocus,
    products,
    segments: createSellerProductSegments(allProducts),
    categoryBreakdown: createSellerProductCategoryBreakdown(allProducts),
    spotlightProduct: createSellerProductSpotlight(products),
    summary: {
      productCount: allProducts.length,
      visibleProductCount: products.length,
      averageHealthScore,
      lowStockProductCount,
      riskyProductCount,
      categoryCount,
    },
  };
}

export function getSellerProductHealthApiData(productId: string): SellerProductHealthApiData | undefined {
  const health = analyzeProductHealthWorkflow(productId);
  const detail = getProductDetail(productId);

  if (!health || !detail) {
    return undefined;
  }

  const actions = generateSellerActionsWorkflow(detail.product.sellerId)?.actions ?? [];
  const relatedProducts = detail.relatedProducts
    .filter((product) => product.sellerId === detail.product.sellerId)
    .slice(0, 4)
    .map((product) => createSellerProductRow(product, actions));
  const relatedActions = actions.filter((action) => action.productIds.includes(productId));

  return {
    contract: createContractMeta(detail.product.sellerId),
    product: createSellerProductRow(detail.product, actions),
    scorecard: health.scorecard,
    topInsights: health.topInsights,
    relatedProducts,
    relatedActions,
    evidenceSnapshot: [
      {
        label: "Stok güveni",
        value: `${health.scorecard.inventory.score}/100`,
        helper: health.scorecard.inventory.recommendedFocus,
      },
      {
        label: "Yorum güveni",
        value: `${health.scorecard.reviews.score}/100`,
        helper: health.scorecard.reviews.recommendedFocus,
      },
      {
        label: "Listeleme",
        value: `${health.scorecard.listing.score}/100`,
        helper: health.scorecard.listing.recommendedFocus,
      },
      {
        label: "Kârlılık",
        value: `${health.scorecard.profitability.score}/100`,
        helper: health.scorecard.profitability.recommendedFocus,
      },
    ],
  };
}

export function getSellerProductHealthApiDataBySlug(slug: string): SellerProductHealthApiData | undefined {
  const product = getProductBySlug(slug);

  if (!product) {
    return undefined;
  }

  return getSellerProductHealthApiData(product.id);
}

export function getSellerBuyerSignalsApiData(sellerId = demoSellerId): SellerBuyerSignalsApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const sellerActions = generateSellerActionsWorkflow(sellerId);

  if (!overview || !sellerActions) {
    return undefined;
  }

  const sellerProductIds = new Set(overview.products.map((product) => product.id));
  const promptResults = buyerSmartCartExamples.map((example) => ({
    example,
    data: getBuyerSmartCartApiData({
      buyerId: example.buyerId,
      prompt: example.prompt,
    }),
  }));

  const signals = promptResults
    .flatMap(({ example, data }) =>
      data.result.sellerSignalCandidates
        .map((candidate, index) =>
          createBuyerSignalRow({
            candidate,
            exampleId: example.id,
            sourcePrompt: example.prompt,
            buyerId: data.result.buyerId ?? example.buyerId,
            buyerName: data.result.buyerName,
            intentLabel: data.summary.intentLabel,
            sellerActions: sellerActions.actions,
            sellerProductIds,
            signalIndex: index,
          }),
        )
        .filter((signal): signal is SellerBuyerSignalApiRow => Boolean(signal)),
    )
    .sort((first, second) => second.priorityScore - first.priorityScore);

  const affectedProductIds = new Set(
    signals.flatMap((signal) => signal.affectedProducts.map((product) => product.id)),
  );
  const typeCoverage = createBuyerSignalTypeCoverage(signals);
  const averagePriorityScore =
    signals.length > 0 ? Math.round(signals.reduce((sum, signal) => sum + signal.priorityScore, 0) / signals.length) : 0;

  return {
    contract: {
      ...createContractMeta(sellerId, promptResults[0]?.data.contract.generatedAt, "buyer-smart-cart-workflow"),
      endpoint: sellerBuyerSignalsEndpoint,
      method: "GET",
      source: "buyer-smart-cart-workflow",
    },
    seller: createSellerSummary(overview.seller),
    summary: {
      promptCount: promptResults.length,
      signalCount: signals.length,
      affectedProductCount: affectedProductIds.size,
      highPrioritySignalCount: signals.filter((signal) => signal.priorityScore >= 80).length,
      averagePriorityScore,
      typeCoverage,
    },
    loopNarrative:
      "Buyer Smart Cart örnekleri deterministik olarak çalıştırılır; seçili ürün, uyarı ve tercih çıktıları satıcıya ürün, kargo, yorum, bundle ve renk talebi sinyali olarak aktarılır.",
    promptSnapshots: promptResults.map(({ example, data }) => ({
      id: example.id,
      label: example.label,
      helper: example.helper,
      buyerId: data.result.buyerId ?? example.buyerId,
      buyerName: data.result.buyerName,
      prompt: example.prompt,
      intentLabel: data.summary.intentLabel,
      confidenceScore: data.summary.confidenceScore,
      totalPrice: data.summary.totalPrice,
      signalCount: data.summary.sellerSignalCount,
      selectedProductNames: data.result.selectedItems.map((item) => item.productName),
    })),
    signals,
  };
}

function createSellerActionListItem(
  action: SellerGrowthAction,
  sellerProducts: Product[],
  allActions: SellerGrowthAction[],
): SellerActionListItem {
  const productById = new Map(sellerProducts.map((product) => [product.id, product]));
  const affectedProducts = action.productIds
    .map((productId) => productById.get(productId))
    .filter((product): product is Product => Boolean(product))
    .map((product) => createSellerProductRow(product, allActions));

  return {
    action,
    affectedProducts,
    evidence: createSellerActionListEvidence(action, affectedProducts),
    focusTags: createSellerActionFocusTags(action),
    href: `/seller/actions/${action.id}`,
    id: action.id,
    primaryProduct: affectedProducts[0],
  };
}

function createSellerActionFocusTags(action: SellerGrowthAction): SellerActionsFocusKey[] {
  const tags = new Set<SellerActionsFocusKey>(["all", sellerActionCategoryFocusMap[action.category]]);

  if (action.type === "restock" || action.type === "pause_promotion") {
    tags.add("stock-risk");
  }

  if (action.type === "review_attention") {
    tags.add("negative-reviews");
  }

  if (action.type === "reduce_return_risk" || action.type === "protect_margin") {
    tags.add("return-risk");
  }

  if (action.type === "fix_listing" || action.type === "create_bundle" || action.type === "promote_winner") {
    tags.add("slow-movers");
  }

  return Array.from(tags);
}

function createSellerActionListEvidence(
  action: SellerGrowthAction,
  affectedProducts: SellerProductApiRow[],
): SellerActionListEvidence[] {
  const primaryProduct = affectedProducts[0];
  const productRiskCount = affectedProducts.filter((product) => product.focusTags.includes("at-risk")).length;
  const firstMetric = action.metricHighlights[0];
  const secondMetric = action.metricHighlights[1];

  return [
    {
      helper: firstMetric?.helperText ?? action.timeHorizonLabel,
      label: firstMetric?.label ?? "Öncelik",
      tone: action.urgency === "critical" ? "warning" : "calm",
      value: firstMetric?.value ?? `${action.priorityScore}/100`,
    },
    {
      helper: secondMetric?.helperText ?? `${affectedProducts.length} ürün aksiyona bağlı`,
      label: secondMetric?.label ?? "Ürün",
      tone: productRiskCount > 0 ? "warning" : "calm",
      value: secondMetric?.value ?? String(affectedProducts.length),
    },
    {
      helper: primaryProduct?.healthLabel ?? "Ürün kanıtı yok",
      label: "Ürün sağlığı",
      tone: primaryProduct && primaryProduct.healthScore < 70 ? "warning" : "good",
      value: primaryProduct ? `${primaryProduct.healthScore}/100` : "Yok",
    },
  ];
}

function filterSellerActionCardsByFocus(
  actionCards: SellerActionListItem[],
  focus: SellerActionsFocusKey,
): SellerActionListItem[] {
  if (focus === "all") {
    return actionCards;
  }

  const category = sellerActionFocusCategoryMap[focus];

  if (category) {
    return actionCards.filter((card) => card.action.category === category);
  }

  return actionCards.filter((card) => card.focusTags.includes(focus));
}

function createSellerActionSegments(actionCards: SellerActionListItem[]): SellerActionsSegment[] {
  return sellerActionFocusOrder
    .map((id) => {
      const meta = sellerActionSegmentMeta[id];
      const matchingCards = filterSellerActionCardsByFocus(actionCards, id);
      const productCount = new Set(matchingCards.flatMap((card) => card.affectedProducts.map((product) => product.id))).size;

      return {
        actionCount: matchingCards.length,
        apiEndpoint: id === "all" ? sellerActionsEndpoint : `${sellerActionsEndpoint}?focus=${id}`,
        helper: meta.helper,
        href: getSellerActionFocusHref(id, meta.kind),
        id,
        kind: meta.kind,
        label: meta.label,
        ownerLabel: meta.ownerLabel,
        productCount,
        tone: meta.tone,
      };
    })
    .filter((segment) => segment.kind === "all" || segment.actionCount > 0);
}

function getSellerActionFocusHref(
  focus: SellerActionsFocusKey,
  kind: SellerActionsSegment["kind"] = sellerActionSegmentMeta[focus].kind,
): string {
  if (focus === "all") {
    return "/seller/actions";
  }

  if (kind === "category") {
    return `/seller/actions/${focus}`;
  }

  return `/seller/actions?focus=${focus}`;
}

function createSellerProductRow(
  product: Product,
  actions: SellerGrowthAction[] = [],
): SellerProductApiRow {
  const detail = getProductDetail(product.id);
  const scorecard = detail ? scoreProduct(detail) : undefined;
  const availableStock = getAvailableStock(product);
  const stockStatus = getStockStatus(availableStock, product.stock.reorderPoint);
  const healthScore = scorecard?.health.score ?? 0;
  const riskSignals = createSellerProductRiskSignals({
    actions,
    availableStock,
    healthScore,
    product,
    stockStatus,
  });

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    categoryLabel: productCategoryLabels[product.category],
    subcategory: product.subcategory,
    price: product.price,
    currency: product.currency,
    availableStock,
    reorderPoint: product.stock.reorderPoint,
    stockStatus,
    stockStatusLabel: getStockStatusLabel(stockStatus),
    healthScore,
    healthLabel: scorecard?.health.label ?? "Skor yok",
    orders30d: product.metrics.orders30d,
    revenue30d: Math.round(product.metrics.revenue30d),
    conversionRate: product.metrics.conversionRate,
    ratingAverage: product.metrics.ratingAverage,
    reviewCount: product.metrics.reviewCount,
    demoStoryFlags: product.demoStoryFlags,
    image: getSellerProductImage(product.id, product.name),
    focusTags: createSellerProductFocusTags(healthScore, riskSignals),
    riskSignals,
    linkedAction: createSellerProductLinkedAction(product.id, actions),
    href: `/seller/products/${product.slug}`,
    apiHealthEndpoint: `/api/seller/products/${product.id}/health`,
  };
}

function createSellerProductRiskSignals({
  actions,
  availableStock,
  healthScore,
  product,
  stockStatus,
}: {
  actions: SellerGrowthAction[];
  availableStock: number;
  healthScore: number;
  product: Product;
  stockStatus: SellerProductApiRow["stockStatus"];
}): SellerProductRiskSignal[] {
  const productActions = actions.filter((action) => action.productIds.includes(product.id));
  const actionTypes = new Set(productActions.map((action) => action.type));
  const signals: SellerProductRiskSignal[] = [];

  if (stockStatus === "risk" || product.demoStoryFlags.includes("low_stock")) {
    signals.push({
      helper: `${availableStock}/${product.stock.reorderPoint} adet`,
      id: "stock-risk",
      label: "Stok riski",
      tone: "danger",
    });
  }

  if (product.demoStoryFlags.includes("negative_review_theme") || actionTypes.has("review_attention")) {
    signals.push({
      helper: `${product.metrics.reviewCount} yorum · ${formatDecimal(product.metrics.ratingAverage)} puan`,
      id: "negative-reviews",
      label: "Negatif yorum",
      tone: "danger",
    });
  }

  if (product.demoStoryFlags.includes("return_risk") || actionTypes.has("reduce_return_risk")) {
    signals.push({
      helper: `${formatPercentValue(product.metrics.returnRate)} iade oranı`,
      id: "return-risk",
      label: "İade riski",
      tone: "warning",
    });
  }

  if (product.demoStoryFlags.includes("slow_mover") || (healthScore < 66 && product.metrics.orders30d < 16)) {
    signals.push({
      helper: `${product.metrics.orders30d} sipariş · ${formatPercentValue(product.metrics.conversionRate)} dönüşüm`,
      id: "slow-movers",
      label: "Satış yavaş",
      tone: "warning",
    });
  }

  if (product.demoStoryFlags.includes("listing_quality_issue") || actionTypes.has("fix_listing")) {
    signals.push({
      helper: `${product.listing.qualityScore}/100 listeleme`,
      id: "listing-gap",
      label: "Listeleme açığı",
      tone: "calm",
    });
  }

  if (product.demoStoryFlags.includes("margin_pressure") || actionTypes.has("protect_margin")) {
    signals.push({
      helper: `${formatTryCompact(Math.max(0, product.price - product.unitCost))} brüt fark`,
      id: "margin-watch",
      label: "Marj baskısı",
      tone: "warning",
    });
  }

  return signals;
}

function createSellerProductFocusTags(
  healthScore: number,
  riskSignals: SellerProductRiskSignal[],
): SellerProductsFocusKey[] {
  const tags = new Set<SellerProductsFocusKey>(["all"]);

  if (healthScore < 70 || riskSignals.length > 0) {
    tags.add("at-risk");
  }

  riskSignals.forEach((signal) => {
    if (sellerProductsFocusKeys.has(signal.id as SellerProductsFocusKey)) {
      tags.add(signal.id as SellerProductsFocusKey);
    }
  });

  return Array.from(tags);
}

function createSellerProductLinkedAction(
  productId: string,
  actions: SellerGrowthAction[],
): SellerProductLinkedAction | undefined {
  const action = actions
    .filter((candidate) => candidate.productIds.includes(productId))
    .sort((first, second) => second.priorityScore - first.priorityScore)[0];

  if (!action) {
    return undefined;
  }

  return {
    href: `/seller/actions/${action.id}`,
    id: action.id,
    ownerLabel: action.todayChecklist[0]?.owner ?? "operasyon",
    priorityScore: action.priorityScore,
    timeHorizonLabel: action.timeHorizonLabel,
    title: action.title,
    type: action.type,
  };
}

function filterSellerProductsByFocus(
  products: SellerProductApiRow[],
  focus: SellerProductsFocusKey,
): SellerProductApiRow[] {
  if (focus === "all") {
    return products;
  }

  return products.filter((product) => product.focusTags.includes(focus));
}

function createSellerProductSegments(products: SellerProductApiRow[]): SellerProductsSegment[] {
  return Array.from(sellerProductsFocusKeys).map((id) => {
    const href = id === "all" ? "/seller/products" : `/seller/products?focus=${id}`;

    return {
      apiEndpoint: id === "all" ? "/api/seller/products" : `/api/seller/products?focus=${id}`,
      helper: sellerProductSegmentMeta[id].helper,
      href,
      id,
      label: sellerProductSegmentMeta[id].label,
      productCount: filterSellerProductsByFocus(products, id).length,
    };
  });
}

function createSellerProductCategoryBreakdown(
  products: SellerProductApiRow[],
): SellerProductCategoryBreakdown[] {
  const categoryGroups = products.reduce((map, product) => {
    const group = map.get(product.category) ?? [];
    group.push(product);
    map.set(product.category, group);
    return map;
  }, new Map<ProductCategory, SellerProductApiRow[]>());

  return Array.from(categoryGroups.entries())
    .map(([category, categoryProducts]) => ({
      averageHealthScore: Math.round(averageValues(categoryProducts.map((product) => product.healthScore))),
      category,
      label: productCategoryLabels[category],
      productCount: categoryProducts.length,
      revenue30d: Math.round(sumValues(categoryProducts.map((product) => product.revenue30d))),
      riskCount: categoryProducts.filter((product) => product.focusTags.includes("at-risk")).length,
    }))
    .sort((first, second) => second.riskCount - first.riskCount || second.revenue30d - first.revenue30d);
}

function createSellerProductSpotlight(
  products: SellerProductApiRow[],
): SellerProductApiRow | undefined {
  return products
    .slice()
    .sort((first, second) => getSellerProductSpotlightScore(second) - getSellerProductSpotlightScore(first))[0];
}

function getSellerProductSpotlightScore(product: SellerProductApiRow): number {
  const stockWeight = product.focusTags.includes("stock-risk") ? 18 : 0;
  const actionWeight = product.linkedAction ? 12 : 0;
  const signalWeight = product.riskSignals.length * 7;

  return 100 - product.healthScore + stockWeight + actionWeight + signalWeight;
}

function createSellerOverviewAlertCards(
  products: SellerProductApiRow[],
  actions: SellerGrowthAction[],
): SellerOverviewAlertCard[] {
  const slowMoverProducts = products
    .filter((product) => product.demoStoryFlags.includes("slow_mover") || (product.healthScore < 66 && product.orders30d < 16))
    .sort((first, second) => first.healthScore - second.healthScore);
  const negativeReviewProducts = products
    .filter((product) =>
      product.demoStoryFlags.includes("negative_review_theme") ||
        actions.some((action) => action.type === "review_attention" && action.productIds.includes(product.id)),
    )
    .sort((first, second) => second.reviewCount - first.reviewCount);
  const returnRiskProducts = products
    .filter((product) =>
      product.demoStoryFlags.includes("return_risk") ||
        actions.some((action) => action.type === "reduce_return_risk" && action.productIds.includes(product.id)),
    )
    .sort((first, second) => first.healthScore - second.healthScore);
  const stockRiskProducts = products
    .filter((product) => product.stockStatus === "risk" || product.availableStock <= product.reorderPoint)
    .sort((first, second) => first.availableStock - second.availableStock);

  return [
    {
      id: "slow_movers",
      title: "Satılmayan ürünler",
      value: String(slowMoverProducts.length),
      summary: "Görünen ama siparişe dönmeyen ürünleri aksiyon sırasına al.",
      href: "/seller/actions?focus=slow-movers",
      apiEndpoint: `${sellerActionsEndpoint}?focus=slow-movers`,
      ownerLabel: "pazarlama",
      tone: "warning",
      productCount: slowMoverProducts.length,
      actionCount: countActions(actions, ["fix_listing", "create_bundle", "promote_winner"]),
      primaryProduct: slowMoverProducts[0],
      primaryAction: createPrimaryAction(actions, ["fix_listing", "create_bundle", "promote_winner"]),
      evidence: [
        {
          label: "Ortalama sağlık",
          value: `${averageHealthScore(slowMoverProducts)}/100`,
          helper: "Düşük skor satış dönüşümünü baskılar.",
        },
        {
          label: "Toplam gelir",
          value: formatTryCompact(sumValues(slowMoverProducts.map((product) => product.revenue30d))),
          helper: "Hâlâ kurtarılabilir ürün hacmi.",
        },
      ],
    },
    {
      id: "negative_reviews",
      title: "Negatif yorumlar",
      value: String(negativeReviewProducts.length),
      summary: "Tekrar eden itiraz temalarını destek ve PDP metnine çevir.",
      href: "/seller/actions?focus=negative-reviews",
      apiEndpoint: `${sellerActionsEndpoint}?focus=negative-reviews`,
      ownerLabel: "destek",
      tone: "danger",
      productCount: negativeReviewProducts.length,
      actionCount: countActions(actions, ["review_attention"]),
      primaryProduct: negativeReviewProducts[0],
      primaryAction: createPrimaryAction(actions, ["review_attention"]),
      evidence: [
        {
          label: "Yorum hacmi",
          value: String(sumValues(negativeReviewProducts.map((product) => product.reviewCount))),
          helper: "Alıcı itirazları ürün sayfasına taşınmalı.",
        },
        {
          label: "Ortalama puan",
          value: formatDecimal(averageValues(negativeReviewProducts.map((product) => product.ratingAverage))),
          helper: "Düşen puan yeni siparişi yavaşlatır.",
        },
      ],
    },
    {
      id: "return_risk",
      title: "İade riski",
      value: String(returnRiskProducts.length),
      summary: "Uyumluluk, kalite ve beklenti farkını satın alma öncesinde kapat.",
      href: "/seller/products?focus=return-risk",
      apiEndpoint: "/api/seller/products?focus=return-risk",
      ownerLabel: "operasyon",
      tone: "warning",
      productCount: returnRiskProducts.length,
      actionCount: countActions(actions, ["reduce_return_risk", "protect_margin"]),
      primaryProduct: returnRiskProducts[0],
      primaryAction: createPrimaryAction(actions, ["reduce_return_risk", "protect_margin"]),
      evidence: [
        {
          label: "Riskli ürün",
          value: String(returnRiskProducts.length),
          helper: "İade riski taşıyan ürün satırları.",
        },
        {
          label: "Gelir etkisi",
          value: formatTryCompact(sumValues(returnRiskProducts.map((product) => product.revenue30d))),
          helper: "İade maliyeti en yüksek alan.",
        },
      ],
    },
    {
      id: "stock_risk",
      title: "Stok riski",
      value: String(stockRiskProducts.length),
      summary: "Reorder point altındaki ürünleri vitrin baskısı büyümeden kapat.",
      href: "/seller/products?focus=stock-risk",
      apiEndpoint: "/api/seller/products?focus=stock-risk",
      ownerLabel: "stok",
      tone: "danger",
      productCount: stockRiskProducts.length,
      actionCount: countActions(actions, ["restock", "pause_promotion"]),
      primaryProduct: stockRiskProducts[0],
      primaryAction: createPrimaryAction(actions, ["restock", "pause_promotion"]),
      evidence: [
        {
          label: "Kritik stok",
          value: `${stockRiskProducts[0]?.availableStock ?? 0} adet`,
          helper: "En düşük kullanılabilir stok.",
        },
        {
          label: "Reorder eşiği",
          value: `${stockRiskProducts[0]?.reorderPoint ?? 0} adet`,
          helper: "Altına düşen ürünler vitrin riski yaratır.",
        },
      ],
    },
  ];
}

function createSellerOverviewPriorityQueue(
  alertCards: SellerOverviewAlertCard[],
  actions: SellerGrowthAction[],
): SellerOverviewPriorityItem[] {
  const alertItems = alertCards.map((card) => ({
    helper: card.primaryProduct?.name ?? card.summary,
    href: card.primaryAction?.href ?? card.href,
    id: card.id,
    ownerLabel: card.ownerLabel,
    priorityScore: card.primaryAction?.priorityScore ?? deriveAlertPriority(card),
    title: card.primaryAction?.title ?? card.title,
    tone: card.tone,
  }));
  const actionItems = actions.slice(0, 4).map((action) => {
    const tone: SellerOverviewPriorityItem["tone"] =
      action.urgency === "critical" ? "danger" : action.urgency === "high" ? "warning" : "calm";

    return {
      helper: action.timeHorizonLabel,
      href: `/seller/actions/${action.id}`,
      id: action.id,
      ownerLabel: action.todayChecklist[0]?.owner ?? "operasyon",
      priorityScore: action.priorityScore,
      title: action.title,
      tone,
    };
  });

  return [...alertItems, ...actionItems]
    .sort((first, second) => second.priorityScore - first.priorityScore)
    .slice(0, 4);
}

function createPrimaryAction(
  actions: SellerGrowthAction[],
  types: SellerActionType[],
): SellerOverviewAlertCard["primaryAction"] | undefined {
  const action = actions.find((candidate) => types.includes(candidate.type));

  if (!action) {
    return undefined;
  }

  return {
    href: `/seller/actions/${action.id}`,
    id: action.id,
    priorityScore: action.priorityScore,
    timeHorizonLabel: action.timeHorizonLabel,
    title: action.title,
  };
}

function countActions(actions: SellerGrowthAction[], types: SellerActionType[]): number {
  return actions.filter((action) => types.includes(action.type)).length;
}

function deriveAlertPriority(card: SellerOverviewAlertCard): number {
  const toneScore = card.tone === "danger" ? 82 : card.tone === "warning" ? 74 : 64;

  return Math.min(94, toneScore + card.productCount * 2 + card.actionCount * 3);
}

function averageHealthScore(products: SellerProductApiRow[]): number {
  return Math.round(averageValues(products.map((product) => product.healthScore)));
}

function averageValues(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sumValues(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function formatPercentValue(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
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

let productImageById: Map<string, BuyerCatalogImage> | undefined;

function getSellerProductImage(productId: string, fallbackName: string): BuyerCatalogImage {
  if (!productImageById) {
    productImageById = new Map(
      getBuyerCatalogApiData().products.map((product) => [product.id, product.image]),
    );
  }

  return productImageById.get(productId) ?? {
    alt: fallbackName,
    position: "0% 0%",
    src: "/catalog/buyer-product-sprite.png",
  };
}

function createSellerSummary(seller: NonNullable<ReturnType<typeof getSellerOverview>>["seller"]): SellerSummaryApiData {
  return {
    id: seller.id,
    name: seller.name,
    displayName: seller.displayName,
    rating: seller.rating,
    supportResponseHours: seller.supportResponseHours,
    defaultDeliveryPromiseDays: seller.defaultDeliveryPromiseDays,
  };
}

function createSellerActionExecutionPreview(
  action: SellerGrowthAction,
  affectedProducts: SellerProductApiRow[],
  relatedBuyerSignals: SellerBuyerSignalApiRow[],
): SellerActionExecutionPreview {
  const primaryProduct = affectedProducts[0]?.name ?? "ilgili ürün";
  const buyerSignalSummary = relatedBuyerSignals[0]?.summary;

  if (action.type === "restock") {
    return {
      title: "Stok yenileme taslağı",
      summary: `${primaryProduct} için stok riski kapanana kadar vitrin baskısı kontrollü tutulur.`,
      primaryOwner: "stok",
      steps: [
        {
          id: `${action.id}-purchase-order`,
          title: "Tedarik emri aç",
          detail: `${primaryProduct} için reorder point altına düşmeden stok yenileme talebi oluştur.`,
          owner: "stok",
          priorityLabel: "İlk iş",
        },
        {
          id: `${action.id}-visibility-guard`,
          title: "Vitrin koruması uygula",
          detail: "Stok gelene kadar kampanya basıncını düşür, organik görünürlüğü tamamen kapatma.",
          owner: "operasyon",
          priorityLabel: "Aynı gün",
        },
        {
          id: `${action.id}-delivery-note`,
          title: "Teslimat notunu güncelle",
          detail: "Ürün sayfasında stok ve teslimat beklentisini açık yaz, güven kaybını azalt.",
          owner: "icerik",
          priorityLabel: "Kontrol",
        },
      ],
      generatedDrafts: [
        {
          label: "Operasyon notu",
          body: `${primaryProduct} stok yenileme emri açıldıktan sonra kampanya görünürlüğü yeniden değerlendirilecek.`,
          helper: "İç operasyon mesajı taslağı",
        },
        {
          label: "Ürün sayfası notu",
          body: "Teslimat süresi stok durumuna göre güncellenir; sipariş öncesi tahmini tarih kontrol edilmelidir.",
          helper: "PDP güven notu taslağı",
        },
      ],
    };
  }

  if (action.type === "create_bundle") {
    return {
      title: "Bundle uygulama taslağı",
      summary: `${primaryProduct} çevresinde tek sepetlik tamamlayıcı paket kurgulanır.`,
      primaryOwner: "pazarlama",
      steps: [
        {
          id: `${action.id}-bundle-products`,
          title: "Paket ürünlerini sabitle",
          detail: affectedProducts.map((product) => product.name).join(" + "),
          owner: "pazarlama",
          priorityLabel: "Kurgu",
        },
        {
          id: `${action.id}-bundle-margin`,
          title: "Marj eşiğini kontrol et",
          detail: "İndirim oranı kârlılığı ezmeden sepet değerini artıracak seviyede tutulur.",
          owner: "finans",
          priorityLabel: "Onay",
        },
        {
          id: `${action.id}-bundle-copy`,
          title: "Paket açıklamasını yaz",
          detail: buyerSignalSummary ?? "Alıcı kullanım senaryosuna göre paket faydası açıkça anlatılır.",
          owner: "icerik",
          priorityLabel: "Yayın",
        },
      ],
      generatedDrafts: [
        {
          label: "Bundle başlığı",
          body: `${primaryProduct} ile çalışma alanını tek sepette tamamla`,
          helper: "Kampanya başlığı taslağı",
        },
        {
          label: "Kampanya metni",
          body: "Birlikte kullanılan ürünleri tek pakette topla, kurulum süresini ve karar yükünü azalt.",
          helper: "Listeleme metni taslağı",
        },
      ],
    };
  }

  if (action.type === "review_attention") {
    return {
      title: "Yorum güveni taslağı",
      summary: `${primaryProduct} için tekrar eden itirazlar ürün sayfasında önden yanıtlanır.`,
      primaryOwner: "destek",
      steps: [
        {
          id: `${action.id}-review-cluster`,
          title: "Yorum temasını ayır",
          detail: "Negatif yorumlardaki tekrar eden tema tek cümlelik müşteri itirazına çevrilir.",
          owner: "destek",
          priorityLabel: "İlk iş",
        },
        {
          id: `${action.id}-pdp-answer`,
          title: "PDP cevabı ekle",
          detail: "Ürün açıklaması, sık sorulan soru veya teknik özellik alanı güven notuyla güncellenir.",
          owner: "icerik",
          priorityLabel: "Aynı gün",
        },
        {
          id: `${action.id}-support-reply`,
          title: "Destek yanıtını hazırla",
          detail: "Yeni gelen benzer şikayetlere tutarlı cevap verilecek kısa yanıt taslağı oluşturulur.",
          owner: "destek",
          priorityLabel: "Kontrol",
        },
      ],
      generatedDrafts: [
        {
          label: "PDP güven notu",
          body: `${primaryProduct} için kullanım uyumluluğu ve beklenti notları satın alma öncesi açıkça kontrol edilmelidir.`,
          helper: "Ürün açıklaması eki",
        },
        {
          label: "Destek yanıtı",
          body: "Geri bildiriminiz için teşekkürler. Yaşadığınız konuyu ürün açıklaması ve destek akışında netleştiriyoruz.",
          helper: "Müşteri mesajı taslağı",
        },
      ],
    };
  }

  if (action.type === "protect_margin") {
    return {
      title: "Kârlılık koruma taslağı",
      summary: `${primaryProduct} için fiyat, reklam ve iade baskısı birlikte kontrol edilir.`,
      primaryOwner: "finans",
      steps: [
        {
          id: `${action.id}-margin-floor`,
          title: "Fiyat tabanını belirle",
          detail: "Birim maliyet, iade baskısı ve reklam harcaması birlikte minimum kâr eşiğine bağlanır.",
          owner: "finans",
          priorityLabel: "İlk iş",
        },
        {
          id: `${action.id}-ads-pause`,
          title: "Verimsiz reklamı kıs",
          detail: "Marj eşiğini bozan kampanya ve reklam setleri satış kaybı yaratmadan azaltılır.",
          owner: "pazarlama",
          priorityLabel: "Aynı gün",
        },
        {
          id: `${action.id}-returns-review`,
          title: "İade nedenlerini izle",
          detail: "İade temaları fiyat koruma kararını destekleyecek şekilde haftalık izlenir.",
          owner: "operasyon",
          priorityLabel: "İzleme",
        },
      ],
      generatedDrafts: [
        {
          label: "Fiyat notu",
          body: `${primaryProduct} için kampanya yalnızca marj eşiği korunuyorsa açık kalmalı.`,
          helper: "Finans kontrol notu",
        },
        {
          label: "Operasyon notu",
          body: "İade baskısı düşmeden reklam ölçekleme yapılmamalı.",
          helper: "Haftalık takip notu",
        },
      ],
    };
  }

  return {
    title: "Büyütme uygulama taslağı",
    summary: `${primaryProduct} güçlü performansını kaybetmeden kontrollü görünürlük alır.`,
    primaryOwner: "pazarlama",
    steps: [
      {
        id: `${action.id}-hero-placement`,
        title: "Vitrin yerleşimini aç",
        detail: `${primaryProduct} için yüksek performanslı kategori vitrini ve arama sonucu görünürlüğü artırılır.`,
        owner: "pazarlama",
        priorityLabel: "Kurgu",
      },
      {
        id: `${action.id}-stock-guard`,
        title: "Stok güvenliğini doğrula",
        detail: "Görünürlük artmadan önce eldeki stok ve tedarik süresi kontrol edilir.",
        owner: "stok",
        priorityLabel: "Kontrol",
      },
      {
        id: `${action.id}-cross-sell`,
        title: "Tamamlayıcı ürünü bağla",
        detail: "Sepet değerini artırmak için uyumlu ürün önerisi aynı sayfada gösterilir.",
        owner: "pazarlama",
        priorityLabel: "Yayın",
      },
    ],
    generatedDrafts: [
      {
        label: "Vitrin metni",
        body: `${primaryProduct} yüksek memnuniyet ve güçlü satış sinyaliyle öne çıkarıldı.`,
        helper: "Kategori vitrini taslağı",
      },
      {
        label: "Cross-sell notu",
        body: "Bu ürünle birlikte kullanılan tamamlayıcı önerileri sepete eklemeden önce göster.",
        helper: "Öneri modülü metni",
      },
    ],
  };
}

function createSellerActionEvidenceSnapshot(
  action: SellerGrowthAction,
  affectedProducts: SellerProductApiRow[],
  relatedBuyerSignals: SellerBuyerSignalApiRow[],
): SellerActionEvidenceSnapshot[] {
  const primaryProduct = affectedProducts[0];
  const metricEvidence = action.metricHighlights.slice(0, 3).map((metric) => ({
    label: metric.label,
    value: metric.value,
    helper: metric.helperText ?? action.timeHorizonLabel,
    tone: metric.tone === "danger" || metric.tone === "warning" ? "warning" : "calm",
  }) satisfies SellerActionEvidenceSnapshot);

  return [
    {
      label: "Öncelik",
      value: `${action.priorityScore}/100`,
      helper: action.expectedOutcome,
      tone: action.urgency === "critical" ? "warning" : "good",
    },
    ...metricEvidence,
    {
      label: "Ürün etkisi",
      value: `${affectedProducts.length} ürün`,
      helper: primaryProduct ? `${primaryProduct.name} · ${primaryProduct.healthScore}/100 sağlık` : "Ürün eşleşmesi yok",
      tone: "calm",
    },
    {
      label: "Alıcı sinyali",
      value: `${relatedBuyerSignals.length} sinyal`,
      helper: relatedBuyerSignals[0]?.summary ?? "Bu aksiyona bağlı buyer sinyali henüz yok.",
      tone: relatedBuyerSignals.length > 0 ? "good" : "calm",
    },
  ];
}

function createSellerActionReviewHighlights(
  action: SellerGrowthAction,
  affectedProducts: SellerProductApiRow[],
): SellerActionReviewHighlight[] {
  if (action.type !== "review_attention") {
    return [];
  }

  return affectedProducts
    .flatMap((product) => getReviewsByProductId(product.id))
    .filter((review) => review.needsSellerAttention || review.sentiment === "negative")
    .sort(sortActionReviews)
    .slice(0, 3)
    .map(createSellerActionReviewHighlight);
}

function sortActionReviews(first: Review, second: Review): number {
  const firstPriority = (first.sentiment === "negative" ? 2 : 0) + (first.needsSellerAttention ? 1 : 0);
  const secondPriority = (second.sentiment === "negative" ? 2 : 0) + (second.needsSellerAttention ? 1 : 0);

  if (firstPriority !== secondPriority) {
    return secondPriority - firstPriority;
  }

  return first.rating - second.rating;
}

function createSellerActionReviewHighlight(review: Review): SellerActionReviewHighlight {
  return {
    body: review.body,
    createdAt: review.createdAt,
    id: review.id,
    needsSellerAttention: review.needsSellerAttention,
    rating: review.rating,
    sentiment: review.sentiment,
    sentimentLabel: getReviewSentimentLabel(review.sentiment),
    themeLabels: review.themes.map(getReviewThemeLabel),
    title: review.title,
  };
}

function getReviewSentimentLabel(sentiment: ReviewSentiment): string {
  const labels: Record<ReviewSentiment, string> = {
    negative: "Negatif",
    neutral: "Kararsız",
    positive: "Pozitif",
  };

  return labels[sentiment];
}

function getReviewThemeLabel(theme: ReviewTheme): string {
  const labels: Partial<Record<ReviewTheme, string>> = {
    "dayaniklilik": "Dayanıklılık",
    "fiyat-performans": "Fiyat/performans",
    "iade-riski": "İade riski",
    "kargo-hizi": "Kargo hızı",
    "malzeme-kalitesi": "Malzeme kalitesi",
    "paketleme": "Paketleme",
    "ses-seviyesi": "Ses seviyesi",
    "uyumluluk": "Uyumluluk",
  };

  return labels[theme] ?? theme.replace(/-/g, " ");
}

function isBuyerSignalRelatedToAction(signal: SellerBuyerSignalApiRow, action: SellerGrowthAction): boolean {
  if (signal.matchedSellerActions.some((matchedAction) => matchedAction.id === action.id)) {
    return true;
  }

  return signal.affectedProducts.some((product) => action.productIds.includes(product.id));
}

function createBuyerSignalRow({
  buyerId,
  buyerName,
  candidate,
  exampleId,
  intentLabel,
  sellerActions,
  sellerProductIds,
  signalIndex,
  sourcePrompt,
}: {
  buyerId: string;
  buyerName?: string;
  candidate: BuyerSellerSignalCandidate;
  exampleId: string;
  intentLabel: string;
  sellerActions: SellerGrowthAction[];
  sellerProductIds: Set<string>;
  signalIndex: number;
  sourcePrompt: string;
}): SellerBuyerSignalApiRow | undefined {
  const affectedProductIds = candidate.productIds.filter((productId) => sellerProductIds.has(productId));

  if (affectedProductIds.length === 0) {
    return undefined;
  }

  const affectedProducts = affectedProductIds
    .map((productId) => {
      const product = getProductById(productId);

      return product ? createBuyerSignalProductSummary(product) : undefined;
    })
    .filter((product): product is SellerBuyerSignalProductSummary => Boolean(product));

  if (affectedProducts.length === 0) {
    return undefined;
  }

  const matchedSellerActions = sellerActions
    .filter((action) => action.productIds.some((productId) => affectedProductIds.includes(productId)))
    .slice(0, 2)
    .map((action) => ({
      id: action.id,
      title: action.title,
      priorityScore: action.priorityScore,
      timeHorizonLabel: action.timeHorizonLabel,
    }));
  const priorityScore = getBuyerSignalPriority(candidate, matchedSellerActions.length);

  return {
    id: `${exampleId}-${candidate.type}-${signalIndex + 1}`,
    type: candidate.type,
    typeLabel: getBuyerSignalTypeLabel(candidate.type),
    sourceExampleId: exampleId,
    sourcePrompt,
    buyerId,
    buyerName,
    intentLabel,
    summary: candidate.summary,
    priorityScore,
    priorityLabel: getBuyerSignalPriorityLabel(priorityScore),
    affectedProducts,
    sellerActionHint: getBuyerSignalActionHint(candidate.type, affectedProducts),
    matchedSellerActions,
    evidence: candidate.evidence,
  };
}

function createBuyerSignalProductSummary(product: Product): SellerBuyerSignalProductSummary {
  const row = createSellerProductRow(product);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    healthScore: row.healthScore,
    stockStatusLabel: row.stockStatusLabel,
    href: row.href,
  };
}

function createBuyerSignalTypeCoverage(signals: SellerBuyerSignalApiRow[]): SellerBuyerSignalTypeCoverage[] {
  const counts = new Map<BuyerSellerSignalCandidate["type"], number>();

  signals.forEach((signal) => {
    counts.set(signal.type, (counts.get(signal.type) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([type, count]) => ({
    type,
    label: getBuyerSignalTypeLabel(type),
    count,
  }));
}

function getBuyerSignalPriority(candidate: BuyerSellerSignalCandidate, matchedActionCount: number): number {
  const baseScores: Record<BuyerSellerSignalCandidate["type"], number> = {
    bundle_opportunity: 76,
    buyer_demand: 72,
    color_demand: 68,
    review_friction: 84,
    shipping_friction: 86,
  };
  const productLift = Math.min(candidate.productIds.length * 3, 9);
  const actionLift = matchedActionCount > 0 ? 5 : 0;

  return Math.min(100, baseScores[candidate.type] + productLift + actionLift);
}

function getBuyerSignalPriorityLabel(priorityScore: number): string {
  if (priorityScore >= 85) {
    return "Kritik sinyal";
  }

  if (priorityScore >= 78) {
    return "Yüksek öncelik";
  }

  return "İzlenecek fırsat";
}

function getBuyerSignalTypeLabel(type: BuyerSellerSignalCandidate["type"]): string {
  const labels: Record<BuyerSellerSignalCandidate["type"], string> = {
    bundle_opportunity: "Bundle fırsatı",
    buyer_demand: "Talep sinyali",
    color_demand: "Renk talebi",
    review_friction: "Yorum sürtünmesi",
    shipping_friction: "Kargo sürtünmesi",
  };

  return labels[type];
}

function getBuyerSignalActionHint(
  type: BuyerSellerSignalCandidate["type"],
  affectedProducts: SellerBuyerSignalProductSummary[],
): string {
  const primaryProduct = affectedProducts[0]?.name ?? "ilgili ürün";

  if (type === "shipping_friction") {
    return `${primaryProduct} için teslimat vaadini ve hızlı kargo görünürlüğünü kontrol et.`;
  }

  if (type === "review_friction") {
    return `${primaryProduct} yorumlarında tekrar eden itirazı ürün açıklamasında önden yanıtla.`;
  }

  if (type === "bundle_opportunity") {
    return `${primaryProduct} etrafında tamamlayıcı ürünlerle tek sepetlik paket kurgula.`;
  }

  if (type === "color_demand") {
    return `${primaryProduct} varyant, başlık ve görsellerinde renk uyumu sinyalini görünür yap.`;
  }

  return `${primaryProduct} talebini vitrin, stok ve önerilen ürün sıralamasında öne al.`;
}

function createContractMeta(
  sellerId: string,
  generatedAt = "2026-05-14",
  source: SellerApiContractMeta["source"] = "mock-workflow",
): SellerApiContractMeta {
  return {
    envelope: "success/data/error",
    source,
    generatedAt,
    sellerId,
  };
}

function getAvailableStock(product: Product): number {
  return product.stock.onHand - product.stock.reserved;
}

function getStockStatus(availableStock: number, reorderPoint: number): SellerProductApiRow["stockStatus"] {
  if (availableStock <= reorderPoint) {
    return "risk";
  }

  if (availableStock <= reorderPoint * 2) {
    return "watch";
  }

  return "safe";
}

function getStockStatusLabel(status: SellerProductApiRow["stockStatus"]): string {
  if (status === "risk") {
    return "Risk";
  }

  if (status === "watch") {
    return "İzle";
  }

  return "Güvenli";
}
