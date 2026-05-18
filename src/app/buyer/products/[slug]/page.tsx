import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyerProductPurchasePanel } from "@/components/commerce/buyer-product-purchase-panel";
import {
  BuyerProductReviewsPanel,
  type BuyerProductReviewItem,
} from "@/components/commerce/buyer-product-reviews-panel";
import { getBuyerCatalogProductBySlug } from "@/lib/api/buyer-catalog";
import {
  getBuyerById,
  getProductBySlug,
  getProductDetail,
  getProducts,
  getSellerById,
} from "@/lib/data";
import type {
  Product,
  Review,
  ReviewSentiment,
  ReviewTheme,
} from "@/types/commerce";

export function generateStaticParams(): Array<{ slug: string }> {
  return getProducts().map((product) => ({ slug: product.slug }));
}

export default async function BuyerProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const catalogProduct = getBuyerCatalogProductBySlug(slug);
  if (!catalogProduct) {
    notFound();
  }

  const availableStock = product.stock.onHand - product.stock.reserved;
  const specs = Object.entries(product.specs).slice(0, 6);
  const questionCount = Math.max(12, Math.round(product.metrics.reviewCount * 0.26));
  const seller = getSellerById(product.sellerId);
  const storeName = seller?.displayName ?? product.brand;
  const storeHref = `/buyer/products?store=${encodeURIComponent(product.sellerId)}`;
  const detail = getProductDetail(product.id);
  const reviewItems = createBuyerProductReviewItems(product, detail?.reviews ?? []);
  const campaignItems = [
    "350 TL ve üzeri kargo bedava",
    catalogProduct.discountPercent ? `%${catalogProduct.discountPercent} indirimli fiyat` : "Avantajlı ürün fiyatı",
    product.fulfillment.deliveryPromiseDays <= 2 ? "2 günde kargo avantajı" : `${product.fulfillment.deliveryPromiseDays} günde kargo`,
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/buyer/products"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 hover:text-orange-800 active:translate-y-px"
      >
        Ürünlere dön
      </Link>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr_340px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <div className="aspect-[4/5] rounded-lg bg-slate-100 p-5">
            <div
              aria-label={catalogProduct.image.alt}
              className="h-full rounded-md border border-slate-200 bg-white bg-[length:600%_800%] bg-no-repeat"
              role="img"
              style={{
                backgroundImage: `url(${catalogProduct.image.src})`,
                backgroundPosition: catalogProduct.image.position,
              }}
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-md border border-slate-200 bg-slate-50 bg-[length:600%_800%] bg-no-repeat"
                style={{
                  backgroundImage: `url(${catalogProduct.image.src})`,
                  backgroundPosition: catalogProduct.image.position,
                }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {catalogProduct.categoryLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {product.subcategory}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {catalogProduct.deliveryLabel}
            </span>
          </div>
          <h2 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 md:text-4xl">
            {product.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{product.listing.shortDescription}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-slate-950">{product.metrics.ratingAverage.toFixed(1)}</span>
            <span className="text-amber-600">puan</span>
            <span className="text-slate-500">{product.metrics.reviewCount.toLocaleString("tr-TR")} değerlendirme</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">{questionCount.toLocaleString("tr-TR")} soru-cevap</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">{product.metrics.cartAdds30d.toLocaleString("tr-TR")} kişinin sepetinde</span>
          </div>

          <BuyerProductPurchasePanel availableStock={availableStock} product={catalogProduct} />

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Tahmini teslimat</p>
            <p className="mt-1 text-sm text-slate-600">
              {product.fulfillment.deliveryPromiseDays} gün içinde kargoda. Sepetin bu tarayıcıda korunur.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {specs.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
            <h3 className="text-sm font-semibold text-slate-950">Ürünün kampanyaları</h3>
            <div className="mt-4 space-y-3">
              {campaignItems.map((campaign) => (
                <div key={campaign} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{campaign}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
            <p className="text-sm font-semibold text-slate-500">Satıcı</p>
            <div className="mt-3 rounded-lg bg-slate-50 p-4">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{storeName}</h3>
              <p className="mt-2 text-sm text-slate-600">
                Puan {(seller?.rating ?? product.metrics.ratingAverage).toFixed(1)} · Marka {product.brand} · {product.fulfillment.fastShippingRate.toLocaleString("tr-TR", { style: "percent", maximumFractionDigits: 0 })} hızlı teslimat
              </p>
            </div>
            <Link
              href={storeHref}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              Mağazaya Git
            </Link>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
            <p className="text-sm font-semibold text-orange-700">Agent notu</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Bu ürünü sepetindeki diğer seçimlerle karşılaştırıp hız, fiyat ve yorum riski açısından değerlendirebilir.
            </p>
            <Link
              href="/buyer/agent"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
            >
              Agent ile konuş
            </Link>
          </div>

          <Link
            href="/buyer/cart"
            className="block rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-800 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
          >
            Sepete git
          </Link>
        </aside>
      </section>

      <BuyerProductReviewsPanel items={reviewItems} totalReviewCount={product.metrics.reviewCount} />
    </div>
  );
}

function createBuyerProductReviewItems(product: Product, reviews: Review[]): BuyerProductReviewItem[] {
  const reviewItems = [...reviews]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map(createReviewItem);
  const noteItems = createProductNoteItems(product);

  return [...reviewItems, ...noteItems].slice(0, 8);
}

function createReviewItem(review: Review): BuyerProductReviewItem {
  const buyer = getBuyerById(review.buyerId);

  return {
    body: review.body,
    chips: [
      getSentimentLabel(review.sentiment),
      ...review.themes.map(getReviewThemeLabel),
      `${review.deliveryDays} gün teslimat`,
    ],
    id: review.id,
    metaLabel: `${buyer?.name ?? "Alıcı"} · ${formatDateLabel(review.createdAt)}`,
    rating: review.rating,
    sentimentLabel: review.needsSellerAttention ? "Satıcı aksiyonu gerekli" : undefined,
    sourceLabel: review.verifiedPurchase ? "Doğrulanmış alışveriş" : "Alıcı yorumu",
    title: review.title,
    tone: review.needsSellerAttention || review.sentiment === "negative" ? "attention" : "review",
  };
}

function createProductNoteItems(product: Product): BuyerProductReviewItem[] {
  const styleTags = product.catalog.styleTags.slice(0, 3);
  const useCases = product.catalog.useCases.slice(0, 3);
  const colors = product.catalog.colors.slice(0, 3);
  const packageContents = product.catalog.packageContents.slice(0, 4);
  const issueSummary = product.listing.issueTags.length > 0
    ? product.listing.issueTags.join(", ")
    : "Ürün açıklaması, stok ve teslimat sinyalleri dengeli görünüyor.";

  return [
    {
      body: product.listing.longDescription,
      chips: [product.subcategory, ...styleTags],
      id: `${product.id}-note-listing`,
      metaLabel: "Ürün notu",
      sourceLabel: "Ürün notu",
      title: "Ürün vaadi",
      tone: "note",
    },
    {
      body: `${product.fulfillment.deliveryPromiseDays} gün kargo vaadi ve ${product.fulfillment.fastShippingRate.toLocaleString("tr-TR", { style: "percent", maximumFractionDigits: 0 })} hızlı teslimat oranı var.`,
      chips: ["Teslimat", `${product.fulfillment.averageDeliveryDays.toFixed(1)} gün ortalama`],
      id: `${product.id}-note-delivery`,
      metaLabel: "Teslimat notu",
      sourceLabel: "Ürün notu",
      title: "Teslimat görünümü",
      tone: "note",
    },
    {
      body: `${useCases.join(", ")} kullanım senaryoları için konumlanıyor. Renk paleti: ${colors.join(", ")}.`,
      chips: [...useCases, ...colors],
      id: `${product.id}-note-fit`,
      metaLabel: "Kullanım notu",
      sourceLabel: "Ürün notu",
      title: "Kullanım ve stil uyumu",
      tone: "note",
    },
    {
      body: packageContents.length > 0
        ? `Paket içeriği: ${packageContents.join(", ")}.`
        : "Paket içeriği ürün açıklamasında ayrıca netleştirilebilir.",
      chips: packageContents.length > 0 ? packageContents : ["Paket içeriği"],
      id: `${product.id}-note-package`,
      metaLabel: "Paket notu",
      sourceLabel: "Ürün notu",
      title: "Paket içeriği",
      tone: "note",
    },
    {
      body: issueSummary,
      chips: [`Listeleme skoru ${product.listing.qualityScore}/100`, `Stok ${product.stock.onHand - product.stock.reserved}`],
      id: `${product.id}-note-quality`,
      metaLabel: "Karar notu",
      sourceLabel: "Ürün notu",
      title: "Karar sinyali",
      tone: product.listing.issueTags.length > 0 ? "attention" : "note",
    },
  ];
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getSentimentLabel(sentiment: ReviewSentiment): string {
  const labels: Record<ReviewSentiment, string> = {
    negative: "Negatif",
    neutral: "Nötr",
    positive: "Pozitif",
  };

  return labels[sentiment];
}

function getReviewThemeLabel(theme: ReviewTheme): string {
  const labels: Partial<Record<ReviewTheme, string>> = {
    boyut: "Boyut",
    dayaniklilik: "Dayanıklılık",
    "fiyat-performans": "Fiyat/performans",
    "iade-riski": "İade riski",
    "kargo-hizi": "Kargo hızı",
    konfor: "Konfor",
    kurulum: "Kurulum",
    "malzeme-kalitesi": "Malzeme kalitesi",
    paketleme: "Paketleme",
    "renk-uyumu": "Renk uyumu",
    "ses-seviyesi": "Ses seviyesi",
    tasarim: "Tasarım",
    uyumluluk: "Uyumluluk",
  };

  return labels[theme] ?? theme;
}
