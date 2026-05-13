import { analyzeProductHealthWorkflow, generateSellerActionsWorkflow } from "@/lib/workflows";
import type { ProductHealthWorkflowResult, SellerGrowthAction } from "@/lib/workflows";
import { getProductBySlug, getProductDetail, getSellerOverview } from "@/lib/data";
import { scoreProduct } from "@/lib/scoring";
import type { Product, ProductCategory } from "@/types/commerce";

export const demoSellerId = "seller-commercepilot";

export interface SellerApiContractMeta {
  envelope: "success/data/error";
  source: "mock-workflow";
  generatedAt: string;
  sellerId: string;
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

function createContractMeta(sellerId: string, generatedAt = "2026-05-14"): SellerApiContractMeta {
  return {
    envelope: "success/data/error",
    source: "mock-workflow",
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
