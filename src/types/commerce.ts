export type Currency = "TRY";

export type ProductCategory =
  | "aksesuar"
  | "ev-ofis"
  | "elektronik-aksesuar"
  | "erkek-giyim"
  | "kahve-ekipmanlari"
  | "kadin-giyim"
  | "kozmetik"
  | "masa-calisma-alani"
  | "kucuk-ev-yasam"
  | "spor"
  | "hediye-yasam-tarzi";

export type DemoStoryFlag =
  | "low_stock"
  | "slow_mover"
  | "negative_review_theme"
  | "bundle_candidate"
  | "strong_product"
  | "listing_quality_issue"
  | "margin_pressure"
  | "return_risk"
  | "fast_shipping"
  | "color_style_match";

export type ReviewSentiment = "positive" | "neutral" | "negative";

export type ReviewTheme =
  | "kargo-hizi"
  | "paketleme"
  | "kurulum"
  | "malzeme-kalitesi"
  | "fiyat-performans"
  | "renk-uyumu"
  | "ses-seviyesi"
  | "konfor"
  | "boyut"
  | "uyumluluk"
  | "dayaniklilik"
  | "tasarim"
  | "iade-riski";

export type RelationType = "alternative" | "complementary" | "bundle" | "upgrade";

export type InventoryEventType = "restock" | "sale" | "return" | "adjustment" | "reservation";

export type OrderStatus = "delivered" | "shipped" | "processing" | "returned" | "cancelled";

export type BuyerSensitivity =
  | "fast_shipping"
  | "low_price"
  | "color_match"
  | "quiet_product"
  | "easy_return"
  | "premium_quality"
  | "compact_size";

export interface Seller {
  id: string;
  name: string;
  displayName: string;
  market: "turkey";
  rating: number;
  totalProducts: number;
  joinedAt: string;
  supportResponseHours: number;
  defaultDeliveryPromiseDays: number;
  operatingModel: "mock";
  notes: string[];
}

export interface Product {
  id: string;
  sellerId: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  currency: Currency;
  price: number;
  compareAtPrice?: number;
  unitCost: number;
  stock: {
    onHand: number;
    reserved: number;
    reorderPoint: number;
    restockLeadTimeDays: number;
    lastRestockAt: string;
  };
  fulfillment: {
    deliveryPromiseDays: number;
    averageDeliveryDays: number;
    fastShippingRate: number;
    lateDeliveryComplaintRate: number;
  };
  listing: {
    title: string;
    shortDescription: string;
    longDescription: string;
    qualityScore: number;
    attributeCompleteness: number;
    imageScore: number;
    issueTags: string[];
  };
  catalog: {
    colors: string[];
    styleTags: string[];
    useCases: string[];
    packageContents: string[];
  };
  specs: Record<string, string | number | boolean>;
  metrics: {
    views30d: number;
    orders30d: number;
    revenue30d: number;
    conversionRate: number;
    returnRate: number;
    adSpend30d: number;
    adAttributedRevenue30d: number;
    ratingAverage: number;
    reviewCount: number;
    cartAdds30d: number;
    wishlistAdds30d: number;
  };
  demoStoryFlags: DemoStoryFlag[];
}

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  sentiment: ReviewSentiment;
  themes: ReviewTheme[];
  createdAt: string;
  verifiedPurchase: boolean;
  deliveryDays: number;
  needsSellerAttention: boolean;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  sellerId: string;
  buyerId: string;
  status: OrderStatus;
  createdAt: string;
  deliveredAt?: string;
  items: OrderItem[];
  total: number;
  deliveryDays: number;
  returnedProductIds: string[];
}

export interface InventoryEvent {
  id: string;
  productId: string;
  type: InventoryEventType;
  quantity: number;
  createdAt: string;
  note: string;
}

export interface ProductRelation {
  id: string;
  sourceProductId: string;
  relatedProductId: string;
  type: RelationType;
  strength: number;
  reason: string;
}

export interface Buyer {
  id: string;
  name: string;
  city: string;
  persona: string;
  sensitivities: BuyerSensitivity[];
  preferredColors: string[];
  budgetBand: "ekonomik" | "orta" | "premium";
  previousComplaintThemes: ReviewTheme[];
  notes: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  buyerId: string;
  prompt: string;
  budget: number;
  items: CartItem[];
  status: "draft" | "recommended" | "abandoned";
  rationale: string;
}
