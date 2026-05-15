import Link from "next/link";
import { getProducts } from "@/lib/data";
import type { Product, ProductCategory } from "@/types/commerce";

const marketplaceCategories = [
  "Kadın Giyim",
  "Erkek Giyim",
  "Elektronik",
  "Ev & Yaşam",
  "Kozmetik",
  "Spor",
  "Aksesuar",
];

const categoryLabels: Record<ProductCategory, string> = {
  "elektronik-aksesuar": "Elektronik",
  "ev-ofis": "Ev & Yaşam",
  "hediye-yasam-tarzi": "Aksesuar",
  "kahve-ekipmanlari": "Ev & Yaşam",
  "kucuk-ev-yasam": "Ev & Yaşam",
  "masa-calisma-alani": "Ev & Yaşam",
};

export default function BuyerProductsPage() {
  const products = getProducts().slice(0, 12);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {marketplaceCategories.map((category, index) => (
            <Link
              key={category}
              href="/buyer/products"
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition active:translate-y-px ${
                index === 0
                  ? "border-orange-200 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:text-orange-700"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Ürünler</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
            Bugünün öne çıkan ürünleri
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Hızlı teslimat", "Sepete eklenebilir", "Agent önerisi hazır", "Kampanyalı ürünler"].map((chip) => (
              <span key={chip} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-orange-700">Agent ile hızlı sepet</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            3000 TL altı bütçeyle ihtiyacını yaz, katalogdaki uygun ürünleri birlikte seç.
          </p>
          <Link
            href="/buyer/agent"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
          >
            Agent’a git
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)]"
          >
            <Link href={`/buyer/products/${product.slug}`} className="block">
              <div className="aspect-[4/3] bg-slate-100 p-4">
                <div className="grid h-full place-items-center rounded-md border border-slate-200 bg-white text-center">
                  <span className="text-4xl font-semibold tracking-[-0.06em] text-slate-300">
                    {getProductInitials(product)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-orange-600">{categoryLabels[product.category]}</p>
                <h3 className="mt-2 line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-slate-950">
                  {product.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500">{product.brand} · {product.subcategory}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold tracking-[-0.04em] text-slate-950">{formatTry(product.price)}</p>
                  <p className="text-xs font-medium text-slate-500">{product.metrics.ratingAverage.toFixed(1)} puan</p>
                </div>
              </div>
            </Link>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                className="min-h-10 w-full rounded-full bg-orange-500 px-4 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px"
              >
                Sepete Ekle
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function getProductInitials(product: Product): string {
  return product.brand.slice(0, 2).toUpperCase();
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
