import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/data";
import type { ProductCategory } from "@/types/commerce";

const categoryLabels: Record<ProductCategory, string> = {
  "elektronik-aksesuar": "Elektronik",
  "ev-ofis": "Ev & Yaşam",
  "hediye-yasam-tarzi": "Aksesuar",
  "kahve-ekipmanlari": "Ev & Yaşam",
  "kucuk-ev-yasam": "Ev & Yaşam",
  "masa-calisma-alani": "Ev & Yaşam",
};

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

  const availableStock = product.stock.onHand - product.stock.reserved;
  const specs = Object.entries(product.specs).slice(0, 6);

  return (
    <div className="space-y-5">
      <Link href="/buyer/products" className="inline-flex text-sm font-semibold text-orange-700 transition hover:text-orange-800">
        Ürünlere dön
      </Link>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr_340px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <div className="aspect-[4/5] rounded-lg bg-slate-100 p-5">
            <div className="grid h-full place-items-center rounded-md border border-slate-200 bg-white">
              <span className="text-7xl font-semibold tracking-[-0.08em] text-slate-300">
                {product.brand.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-md border border-slate-200 bg-slate-50" />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {categoryLabels[product.category]}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {product.subcategory}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950">
            {product.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{product.listing.shortDescription}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-slate-950">{product.metrics.ratingAverage.toFixed(1)}</span>
            <span className="text-amber-600">puan</span>
            <span className="text-slate-500">{product.metrics.reviewCount} değerlendirme</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">{product.metrics.cartAdds30d} kişinin sepetinde</span>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-4xl font-semibold tracking-[-0.06em] text-orange-600">{formatTry(product.price)}</p>
              {product.compareAtPrice ? (
                <p className="pb-1 text-sm text-slate-400 line-through">{formatTry(product.compareAtPrice)}</p>
              ) : null}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="min-h-12 rounded-full border border-orange-500 bg-white px-5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 active:translate-y-px"
              >
                Şimdi Al
              </button>
              <button
                type="button"
                className="min-h-12 rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px"
              >
                Sepete Ekle
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Tahmini teslimat</p>
            <p className="mt-1 text-sm text-slate-600">
              {product.fulfillment.deliveryPromiseDays} gün içinde kargoda. Kalan stok: {availableStock} adet.
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
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Satıcı</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">{product.brand}</h3>
            <p className="mt-2 text-sm text-slate-600">Puan {product.metrics.ratingAverage.toFixed(1)} · Hızlı cevap</p>
            <button
              type="button"
              className="mt-5 min-h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              Mağazaya Git
            </button>
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
        </aside>
      </section>
    </div>
  );
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
