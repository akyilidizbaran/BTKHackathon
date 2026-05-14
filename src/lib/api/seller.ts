import { buyerSmartCartExamples, getBuyerSmartCartApiData } from "@/lib/api/buyer";
import { analyzeProductHealthWorkflow, generateSellerActionsWorkflow } from "@/lib/workflows";
import type { BuyerSellerSignalCandidate, ProductHealthWorkflowResult, SellerGrowthAction } from "@/lib/workflows";
import { getProductById, getProductBySlug, getProductDetail, getSellerOverview } from "@/lib/data";
import { scoreProduct } from "@/lib/scoring";
import type { Product, ProductCategory } from "@/types/commerce";

export const demoSellerId = "seller-commercepilot";
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
  topActions: SellerGrowthAction[];
  operationSignals: SellerOperationSignal[];
}

export interface SellerOperationSignal {
  id: string;
  categoryLabel: string;
  title: string;
  value: string;
  helper: string;
  tone: "good" | "calm" | "warning";
}

export interface SellerActionsApiData {
  contract: SellerApiContractMeta;
  seller: SellerSummaryApiData;
  actions: SellerGrowthAction[];
  analyzedProductCount: number;
  actionTypeCoverage: string[];
}

export interface SellerProductsApiData {
  contract: SellerApiContractMeta;
  seller: SellerSummaryApiData;
  products: SellerProductApiRow[];
  summary: {
    productCount: number;
    averageHealthScore: number;
    lowStockProductCount: number;
    riskyProductCount: number;
    categoryCount: number;
  };
}

export interface SellerProductApiRow {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
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
  href: string;
  apiHealthEndpoint: string;
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

export function getSellerOverviewApiData(sellerId = demoSellerId): SellerOverviewApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);

  if (!overview || !workflow) {
    return undefined;
  }

  const lowStockProducts = overview.products.filter((product) => getAvailableStock(product) <= product.stock.reorderPoint);
  const attentionActions = workflow.actions.filter((action) => action.timeHorizon === "today");
  const reviewAttentionCount = workflow.actions.filter((action) => action.type === "review_attention").length;

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
    topActions: workflow.actions,
    operationSignals: workflow.actions.slice(0, 3).map((action) => ({
      id: action.id,
      categoryLabel: action.categoryLabel,
      title: action.title,
      value: action.metricHighlights[0]?.value ?? `${action.priorityScore}/100`,
      helper: action.metricHighlights[0]?.label ?? action.timeHorizonLabel,
      tone: action.urgency === "critical" ? "warning" : action.urgency === "high" ? "calm" : "good",
    })),
  };
}

export function getSellerActionsApiData(sellerId = demoSellerId): SellerActionsApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);

  if (!overview || !workflow) {
    return undefined;
  }

  return {
    contract: createContractMeta(sellerId, workflow.generatedAt),
    seller: createSellerSummary(overview.seller),
    actions: workflow.actions,
    analyzedProductCount: workflow.analyzedProductCount,
    actionTypeCoverage: Array.from(new Set(workflow.actions.map((action) => action.type))),
  };
}

export function getSellerProductsApiData(sellerId = demoSellerId): SellerProductsApiData | undefined {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);

  if (!overview || !workflow) {
    return undefined;
  }

  const products = overview.products.map(createSellerProductRow);
  const averageHealthScore =
    products.length > 0
      ? Math.round(products.reduce((sum, product) => sum + product.healthScore, 0) / products.length)
      : 0;
  const riskyProductCount = products.filter((product) => product.healthScore < 70).length;
  const lowStockProductCount = products.filter((product) => product.stockStatus === "risk").length;
  const categoryCount = new Set(products.map((product) => product.category)).size;

  return {
    contract: createContractMeta(sellerId, workflow.generatedAt),
    seller: createSellerSummary(overview.seller),
    products,
    summary: {
      productCount: products.length,
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
    .map(createSellerProductRow);
  const relatedActions = actions.filter((action) => action.productIds.includes(productId));

  return {
    contract: createContractMeta(detail.product.sellerId),
    product: createSellerProductRow(detail.product),
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

function createSellerProductRow(product: Product): SellerProductApiRow {
  const detail = getProductDetail(product.id);
  const scorecard = detail ? scoreProduct(detail) : undefined;
  const availableStock = getAvailableStock(product);
  const stockStatus = getStockStatus(availableStock, product.stock.reorderPoint);

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory,
    price: product.price,
    currency: product.currency,
    availableStock,
    reorderPoint: product.stock.reorderPoint,
    stockStatus,
    stockStatusLabel: getStockStatusLabel(stockStatus),
    healthScore: scorecard?.health.score ?? 0,
    healthLabel: scorecard?.health.label ?? "Skor yok",
    orders30d: product.metrics.orders30d,
    revenue30d: Math.round(product.metrics.revenue30d),
    conversionRate: product.metrics.conversionRate,
    ratingAverage: product.metrics.ratingAverage,
    reviewCount: product.metrics.reviewCount,
    demoStoryFlags: product.demoStoryFlags,
    href: `/seller/products/${product.slug}`,
    apiHealthEndpoint: `/api/seller/products/${product.id}/health`,
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
