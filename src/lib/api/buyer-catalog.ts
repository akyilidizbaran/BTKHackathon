import { getProductBySlug, getProducts } from "@/lib/data";
import type { Product, ProductCategory } from "@/types/commerce";

export const buyerCatalogEndpoint = "/api/buyer/catalog";
export const buyerProductSpriteSrc = "/catalog/buyer-product-sprite.png";

export type BuyerMarketplaceCategoryId =
  | "kadin-giyim"
  | "erkek-giyim"
  | "elektronik"
  | "ev-yasam"
  | "kozmetik"
  | "spor"
  | "aksesuar";

export type BuyerCatalogSort = "featured" | "price-asc" | "rating" | "fast-delivery";

export interface BuyerCatalogCategory {
  id: BuyerMarketplaceCategoryId;
  label: string;
  helper: string;
  count: number;
  image: BuyerCatalogImage;
}

export interface BuyerCatalogImage {
  src: typeof buyerProductSpriteSrc;
  position: string;
  alt: string;
}

export interface BuyerCatalogProductCard {
  id: string;
  slug: string;
  href: string;
  name: string;
  brand: string;
  categoryId: BuyerMarketplaceCategoryId;
  categoryLabel: string;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  ratingAverage: number;
  reviewCount: number;
  cartAdds30d: number;
  deliveryPromiseDays: number;
  deliveryLabel: string;
  campaignLabel: string;
  badgeTone: "deal" | "popular" | "delivery" | "calm";
  image: BuyerCatalogImage;
}

type BuyerCatalogCategoryBase = Pick<BuyerCatalogCategory, "id" | "label" | "helper">;

export interface BuyerCatalogApiData {
  contract: {
    envelope: "success/data/error";
    source: "mock-commerce-catalog";
    endpoint: typeof buyerCatalogEndpoint;
    generatedAt: string;
  };
  request: {
    category?: BuyerMarketplaceCategoryId;
    sort: BuyerCatalogSort;
  };
  categories: BuyerCatalogCategory[];
  campaignChips: string[];
  products: BuyerCatalogProductCard[];
  summary: {
    productCount: number;
    visibleProductCount: number;
    categoryCount: number;
    fastDeliveryCount: number;
    discountedProductCount: number;
  };
}

const categoryOrder: BuyerCatalogCategoryBase[] = [
  { id: "kadin-giyim", label: "Kadın Giyim", helper: "Triko, pantolon, sade kombin" },
  { id: "erkek-giyim", label: "Erkek Giyim", helper: "Smart casual ve basic parçalar" },
  { id: "elektronik", label: "Elektronik", helper: "Kulaklık, hub, mouse, kamera" },
  { id: "ev-yasam", label: "Ev & Yaşam", helper: "Çalışma alanı ve ev ürünleri" },
  { id: "kozmetik", label: "Kozmetik", helper: "SPF, bakım ve destek ürünleri" },
  { id: "spor", label: "Spor", helper: "Antrenman ve dış mekan ürünleri" },
  { id: "aksesuar", label: "Aksesuar", helper: "Hediye, çanta ve küçük ürünler" },
];

const featuredProductIds = [
  "prod-calliel-spf50-gunes-kremi",
  "prod-sera-krem-triko-kazak",
  "prod-elya-bej-pileli-pantolon",
  "prod-flowmate-kablosuz-mouse",
  "prod-stride-kancali-spor-kulaklik",
  "prod-riseup-laptop-standi",
  "prod-collaberry-gummy-kolajen",
  "prod-luma-led-masa-lambasi",
  "prod-tidy-kablo-duzenleyici",
  "prod-graphite-desk-mat",
  "prod-connectplus-usb-c-hub",
  "prod-clearcam-webcam",
];

const productSpriteColumnCount = 6;
const productSpriteRowCount = 8;
const spritePositions = createSpritePositions(productSpriteColumnCount, productSpriteRowCount);
const categorySpriteProductIds: Record<BuyerMarketplaceCategoryId, string> = {
  aksesuar: "prod-focus-not-defteri-seti",
  elektronik: "prod-flowmate-kablosuz-mouse",
  "erkek-giyim": "prod-nordline-lacivert-polo-kazak",
  "ev-yasam": "prod-ergoflex-calisma-sandalyesi",
  "kadin-giyim": "prod-sera-krem-triko-kazak",
  kozmetik: "prod-calliel-spf50-gunes-kremi",
  spor: "prod-runwell-spor-matara",
};

export function getBuyerCatalogApiData(input: {
  category?: string | null;
  sort?: string | null;
} = {}): BuyerCatalogApiData {
  const allProducts = getProducts().map(createBuyerCatalogProductCard);
  const category = normalizeCategory(input.category);
  const sort = normalizeSort(input.sort);
  const products = sortBuyerCatalogProducts(
    category ? allProducts.filter((product) => product.categoryId === category) : allProducts,
    sort,
  );
  const fastDeliveryCount = allProducts.filter((product) => product.deliveryPromiseDays <= 2).length;
  const discountedProductCount = allProducts.filter((product) => product.discountPercent && product.discountPercent > 0).length;

  return {
    contract: {
      envelope: "success/data/error",
      source: "mock-commerce-catalog",
      endpoint: buyerCatalogEndpoint,
      generatedAt: "2026-05-15",
    },
    request: {
      category,
      sort,
    },
    categories: createBuyerCatalogCategories(allProducts),
    campaignChips: [
      "Bugün fiyatı düşenler",
      "2 günde kargo",
      "Kombin tamamlayanlar",
      "Çok satan bakım",
      "Ev ofis seçkisi",
    ],
    products,
    summary: {
      productCount: allProducts.length,
      visibleProductCount: products.length,
      categoryCount: categoryOrder.length,
      fastDeliveryCount,
      discountedProductCount,
    },
  };
}

export function getBuyerCatalogProductBySlug(slug: string): BuyerCatalogProductCard | undefined {
  const product = getProductBySlug(slug);

  return product ? createBuyerCatalogProductCard(product) : undefined;
}

export function isBuyerMarketplaceCategory(value: string | null | undefined): value is BuyerMarketplaceCategoryId {
  return categoryOrder.some((category) => category.id === value);
}

function createBuyerCatalogCategories(products: BuyerCatalogProductCard[]): BuyerCatalogCategory[] {
  return categoryOrder.map((category) => {
    const spriteIndex = getCategorySpriteIndex(category.id);

    return {
      ...category,
      count: products.filter((product) => product.categoryId === category.id).length,
      image: {
        src: buyerProductSpriteSrc,
        position: spritePositions[spriteIndex] ?? spritePositions[0],
        alt: category.label,
      },
    };
  });
}

function createBuyerCatalogProductCard(product: Product): BuyerCatalogProductCard {
  const category = getMarketplaceCategory(product.category);
  const discountPercent = product.compareAtPrice
    ? Math.max(1, Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100))
    : undefined;
  const spriteIndex = getProductSpriteIndex(product);

  return {
    id: product.id,
    slug: product.slug,
    href: `/buyer/products/${product.slug}`,
    name: product.name,
    brand: product.brand,
    categoryId: category.id,
    categoryLabel: category.label,
    subcategory: product.subcategory,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    discountPercent,
    ratingAverage: product.metrics.ratingAverage,
    reviewCount: product.metrics.reviewCount,
    cartAdds30d: product.metrics.cartAdds30d,
    deliveryPromiseDays: product.fulfillment.deliveryPromiseDays,
    deliveryLabel: product.fulfillment.deliveryPromiseDays <= 2 ? "2 günde kargo" : `${product.fulfillment.deliveryPromiseDays} günde kargo`,
    campaignLabel: getCampaignLabel(product, discountPercent),
    badgeTone: getBadgeTone(product, discountPercent),
    image: {
      src: buyerProductSpriteSrc,
      position: spritePositions[spriteIndex] ?? spritePositions[0],
      alt: product.name,
    },
  };
}

function getMarketplaceCategory(category: ProductCategory): BuyerCatalogCategoryBase {
  if (category === "kadin-giyim") {
    return categoryOrder[0];
  }

  if (category === "erkek-giyim") {
    return categoryOrder[1];
  }

  if (category === "elektronik-aksesuar") {
    return categoryOrder[2];
  }

  if (["ev-ofis", "kahve-ekipmanlari", "kucuk-ev-yasam", "masa-calisma-alani"].includes(category)) {
    return categoryOrder[3];
  }

  if (category === "kozmetik") {
    return categoryOrder[4];
  }

  if (category === "spor") {
    return categoryOrder[5];
  }

  return categoryOrder[6];
}

function getProductSpriteIndex(product: Product): number {
  const index = getProducts().findIndex((candidate) => candidate.id === product.id);

  if (index >= 0) {
    return index;
  }

  return Math.abs(hashString(product.id)) % spritePositions.length;
}

function getCategorySpriteIndex(categoryId: BuyerMarketplaceCategoryId): number {
  const productId = categorySpriteProductIds[categoryId];
  const index = getProducts().findIndex((product) => product.id === productId);

  return index >= 0 ? index : 0;
}

function createSpritePositions(columns: number, rows: number): string[] {
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = columns === 1 ? 0 : (column / (columns - 1)) * 100;
    const y = rows === 1 ? 0 : (row / (rows - 1)) * 100;

    return `${formatSpritePercent(x)}% ${formatSpritePercent(y)}%`;
  });
}

function formatSpritePercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/u, "").replace(/\.$/u, "");
}

function sortBuyerCatalogProducts(
  products: BuyerCatalogProductCard[],
  sort: BuyerCatalogSort,
): BuyerCatalogProductCard[] {
  const featuredRank = new Map(featuredProductIds.map((id, index) => [id, index]));
  const sorted = [...products];

  if (sort === "price-asc") {
    return sorted.sort((first, second) => first.price - second.price);
  }

  if (sort === "rating") {
    return sorted.sort((first, second) => second.ratingAverage - first.ratingAverage);
  }

  if (sort === "fast-delivery") {
    return sorted.sort((first, second) => first.deliveryPromiseDays - second.deliveryPromiseDays || second.ratingAverage - first.ratingAverage);
  }

  return sorted.sort((first, second) => {
    const firstRank = featuredRank.get(first.id) ?? 999;
    const secondRank = featuredRank.get(second.id) ?? 999;

    if (firstRank !== secondRank) {
      return firstRank - secondRank;
    }

    return second.cartAdds30d - first.cartAdds30d;
  });
}

function getCampaignLabel(product: Product, discountPercent?: number): string {
  if (discountPercent && discountPercent >= 15) {
    return `%${discountPercent} indirim`;
  }

  if (product.metrics.orders30d >= 180) {
    return "Çok satan";
  }

  if (product.fulfillment.deliveryPromiseDays <= 2) {
    return "Hızlı kargo";
  }

  return "Avantajlı ürün";
}

function getBadgeTone(product: Product, discountPercent?: number): BuyerCatalogProductCard["badgeTone"] {
  if (discountPercent && discountPercent >= 15) {
    return "deal";
  }

  if (product.metrics.orders30d >= 180) {
    return "popular";
  }

  if (product.fulfillment.deliveryPromiseDays <= 2) {
    return "delivery";
  }

  return "calm";
}

function normalizeCategory(category: string | null | undefined): BuyerMarketplaceCategoryId | undefined {
  return isBuyerMarketplaceCategory(category) ? category : undefined;
}

function normalizeSort(sort: string | null | undefined): BuyerCatalogSort {
  if (sort === "price-asc" || sort === "rating" || sort === "fast-delivery") {
    return sort;
  }

  return "featured";
}

function hashString(value: string): number {
  return value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
}
