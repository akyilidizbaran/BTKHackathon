import Link from "next/link";
import { getSellerProductsApiData } from "@/lib/api/seller";

export default function SellerProductsPage() {
  const data = getSellerProductsApiData();

  if (!data) {
    return (
      <EmptyPanel
        title="Ürün contract’ı üretilemedi"
        description="Demo satıcı ürünleri okunamadı. Mock product ve seller id referansları kontrol edilmeli."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-emerald-200/80">Ürün radarı</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            Her ürün bir karar sinyali taşıyor.
          </h2>
          <p className="mt-5 max-w-[64ch] text-sm leading-7 text-zinc-500">
            Liste satırları ürün sağlık endpoint’lerine bağlanır. Detay sayfası aynı contract ile skor kırılımını,
            kanıtları ve ilgili aksiyonları gösterir.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Ürün contract özeti</p>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
            <Metric label="Ürün" value={String(data.summary.productCount)} />
            <Metric label="Ortalama sağlık" value={`${data.summary.averageHealthScore}/100`} />
            <Metric label="Stok riski" value={String(data.summary.lowStockProductCount)} />
            <Metric label="Kategori" value={String(data.summary.categoryCount)} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <div className="hidden grid-cols-[1.25fr_0.55fr_0.55fr_0.55fr_120px] gap-4 border-b border-white/10 px-5 py-4 text-xs text-zinc-500 md:grid md:px-7">
          <span>Ürün</span>
          <span>Sağlık</span>
          <span>Stok</span>
          <span>Satış</span>
          <span>Endpoint</span>
        </div>

        {data.products.length > 0 ? (
          <div className="divide-y divide-white/10">
            {data.products.slice(0, 18).map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.03] active:translate-y-px md:grid-cols-[1.25fr_0.55fr_0.55fr_0.55fr_120px] md:px-7"
              >
                <div>
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {product.category} · {product.brand}
                  </p>
                  <p className="mt-3 block font-mono text-xs text-zinc-600 md:hidden">{product.apiHealthEndpoint}</p>
                </div>
                <ProductMetric value={`${product.healthScore}/100`} helper={product.healthLabel} />
                <ProductMetric value={`${product.availableStock} adet`} helper={product.stockStatusLabel} />
                <ProductMetric value={`${product.orders30d} sipariş`} helper={formatTry(product.revenue30d)} />
                <div className="hidden min-w-0 items-center md:flex">
                  <span className="truncate font-mono text-xs text-emerald-200/70">health</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-5 md:p-7">
            <EmptyPanel
              title="Ürün listesi boş"
              description="Bu seller için ürün bulunamadı. Ürün verisi eklendiğinde radar otomatik dolacak."
            />
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/55 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-lg font-medium tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function ProductMetric({ value, helper }: { value: string; helper: string }) {
  return (
    <div>
      <p className="font-mono text-lg tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{helper}</p>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-zinc-950/35 p-6">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
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
