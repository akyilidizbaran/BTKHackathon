import Link from "next/link";
import { getSellerOverviewApiData, getSellerProductsApiData } from "@/lib/api/seller";
import type { ProductCategory } from "@/types/commerce";

const categoryLabels: Record<ProductCategory, string> = {
  "elektronik-aksesuar": "Elektronik",
  "ev-ofis": "Ev & Yaşam",
  "hediye-yasam-tarzi": "Aksesuar",
  "kahve-ekipmanlari": "Ev & Yaşam",
  "kucuk-ev-yasam": "Ev & Yaşam",
  "masa-calisma-alani": "Ev & Yaşam",
};

export default function SellerOverviewPage() {
  const overview = getSellerOverviewApiData();
  const products = getSellerProductsApiData();

  if (!overview || !products) {
    return (
      <EmptyPanel
        title="Satıcı verisi bulunamadı"
        description="Mock seller ve workflow referansları kontrol edilmeli."
      />
    );
  }

  const categoryCounts = Array.from(
    products.products.reduce((map, product) => {
      const label = categoryLabels[product.category];
      map.set(label, (map.get(label) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((first, second) => second[1] - first[1]);

  const alertCards = [
    {
      title: "Satılmayan ürünler",
      value: String(products.summary.riskyProductCount),
      helper: "Sağlık skoru düşük ürünleri incele",
      href: "/seller/actions",
    },
    {
      title: "Negatif yorumlar",
      value: String(overview.stats.reviewAttentionCount),
      helper: "Tekrarlayan itiraz temalarını aç",
      href: "/seller/actions",
    },
    {
      title: "İade riski",
      value: String(products.products.filter((product) => product.demoStoryFlags.includes("return_risk")).length),
      helper: "Ürün sayfası ve beklenti eşleşmesini kontrol et",
      href: "/seller/products",
    },
    {
      title: "Stok riski",
      value: String(overview.stats.lowStockProductCount),
      helper: "Reorder point altındaki ürünleri gör",
      href: "/seller/products",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
            {overview.seller.displayName}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
            Satıcı ana sayfası
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-4">
            <Metric label="Ürün" value={String(overview.stats.analyzedProductCount)} />
            <Metric label="Sipariş" value={String(overview.stats.totalOrders30d)} />
            <Metric label="Gelir" value={formatTry(overview.stats.totalRevenue30d)} />
            <Metric label="Sağlık" value={`${products.summary.averageHealthScore}/100`} />
          </div>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-orange-700">Agent kısa yolu</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            &quot;Satılmayan ürünlerimi sırala&quot; komutuyla riskli ürünleri gerekçeleriyle açabilirsin.
          </p>
          <Link
            href="/seller/agent"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
          >
            Agent’a git
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {alertCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)] transition hover:border-orange-200 hover:bg-orange-50 active:translate-y-px"
          >
            <p className="text-sm font-semibold text-slate-700">{card.title}</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.helper}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Ürün dağılımı</h3>
          <div className="mt-5 space-y-4">
            {categoryCounts.map(([label, count]) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="font-semibold text-slate-950">{count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${Math.max(12, (count / products.summary.productCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Öne çıkan ürünler</h3>
            <Link href="/seller/products" className="text-sm font-semibold text-orange-700 hover:text-orange-800">
              Tümünü gör
            </Link>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {products.products.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="grid gap-4 py-4 transition hover:bg-slate-50 md:grid-cols-[1fr_120px_110px]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.brand} · {product.stockStatusLabel}</p>
                </div>
                <p className="font-mono text-sm text-slate-700">{product.healthScore}/100</p>
                <p className="font-mono text-sm text-slate-700">{formatTry(product.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
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
