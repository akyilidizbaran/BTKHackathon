import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSellerProductHealthApiDataBySlug,
  getSellerProductsApiData,
} from "@/lib/api/seller";

export function generateStaticParams(): Array<{ slug: string }> {
  return getSellerProductsApiData()?.products.map((product) => ({ slug: product.slug })) ?? [];
}

export default async function SellerProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getSellerProductHealthApiDataBySlug(slug);

  if (!data) {
    notFound();
  }

  const scoreDimensions = [
    data.scorecard.inventory,
    data.scorecard.reviews,
    data.scorecard.listing,
    data.scorecard.shipping,
    data.scorecard.returns,
    data.scorecard.profitability,
    data.scorecard.promotionReadiness,
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <Link
            href="/seller/products"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-emerald-200 transition hover:bg-white/15 hover:text-emerald-100 active:translate-y-px"
          >
            Ürün radarına dön
          </Link>
          <p className="mt-6 text-sm text-zinc-500">
            {data.product.brand} · {data.product.subcategory}
          </p>
          <h2 className="mt-3 max-w-5xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            {data.product.name}
          </h2>
          <p className="mt-5 max-w-[68ch] text-sm leading-7 text-zinc-500">
            Skor kırılımı, zayıf sinyaller ve önerilen aksiyonlar tek ürün üzerinden okunur. Satıcı bu ekranda
            hangi alanın bugün iyileştirileceğini hızlıca görür.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
            <Metric label="Sağlık skoru" value={`${data.product.healthScore}/100`} />
            <Metric label="Stok" value={`${data.product.availableStock} adet`} />
            <Metric label="30 gün satış" value={`${data.product.orders30d} sipariş`} />
            <Metric label="Gelir" value={formatTry(data.product.revenue30d)} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Satış sinyalleri</p>
          <p className="mt-5 text-sm leading-7 text-zinc-500">
            Dönüşüm, puan, yorum hacmi ve stok durumu ürünün güncel aksiyon önceliğini belirler.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
            <Metric label="Dönüşüm" value={formatPercent(data.product.conversionRate)} />
            <Metric label="Puan" value={data.product.ratingAverage.toFixed(1)} />
            <Metric label="Yorum" value={String(data.product.reviewCount)} />
            <Metric label="Stok durumu" value={data.product.stockStatusLabel} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Skor kırılımı</h3>
              <p className="mt-2 text-sm text-zinc-500">{data.scorecard.health.summary}</p>
            </div>
            <p className="font-mono text-3xl tracking-[-0.06em] text-white">{data.scorecard.health.score}/100</p>
          </div>

          <div className="mt-5 divide-y divide-white/10">
            {scoreDimensions.map((dimension) => (
              <div key={dimension.label} className="grid gap-4 py-5 md:grid-cols-[140px_1fr]">
                <div>
                  <p className="font-mono text-2xl tracking-[-0.05em] text-white">{dimension.score}/100</p>
                  <p className="mt-1 text-xs text-zinc-500">{dimension.label}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{dimension.summary}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{dimension.recommendedFocus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Öncelikli içgörüler</h3>
            <div className="mt-5 divide-y divide-white/10">
              {data.topInsights.map((insight) => (
                <div key={insight.title} className="py-4">
                  <p className="font-mono text-xl tracking-[-0.05em] text-white">{insight.score}/100</p>
                  <p className="mt-2 text-sm font-medium text-white">{insight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{insight.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Özet sinyaller</h3>
            <div className="mt-5 divide-y divide-white/10">
              {data.evidenceSnapshot.map((item) => (
                <div key={item.label} className="py-4">
                  <p className="text-sm text-zinc-500">{item.label}</p>
                  <p className="mt-2 font-mono text-xl tracking-[-0.05em] text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">İlgili aksiyonlar</h3>
          <div className="mt-5 divide-y divide-white/10">
            {data.relatedActions.length > 0 ? (
              data.relatedActions.map((action) => (
                <Link
                  key={action.id}
                  href={`/seller/actions/${action.id}`}
                  className="block py-4 transition hover:bg-white/[0.025]"
                >
                  <p className="text-sm font-medium text-white">{action.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{action.expectedOutcome}</p>
                  <p className="mt-3 font-mono text-xs text-emerald-200/80">{action.priorityScore}/100</p>
                </Link>
              ))
            ) : (
              <EmptyPanel
                title="Bu ürüne bağlı aksiyon yok"
                description="Şu an bu ürün için öncelikli yapılacak iş görünmüyor."
              />
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">İlişkili ürünler</h3>
          <div className="mt-5 divide-y divide-white/10">
            {data.relatedProducts.length > 0 ? (
              data.relatedProducts.map((product) => (
                <Link key={product.id} href={product.href} className="grid gap-3 py-4 transition hover:bg-white/[0.025] md:grid-cols-[1fr_120px]">
                  <div>
                    <p className="text-sm font-medium text-white">{product.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{product.brand} · {product.category}</p>
                  </div>
                  <div className="font-mono text-sm text-emerald-200/80">{product.healthScore}/100</div>
                </Link>
              ))
            ) : (
              <EmptyPanel
                title="İlişkili ürün yok"
                description="Bu ürün için henüz bundle, alternatif veya tamamlayıcı ürün ilişkisi yok."
              />
            )}
          </div>
        </div>
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

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-zinc-950/35 p-5">
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

function formatPercent(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}
