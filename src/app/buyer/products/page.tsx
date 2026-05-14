import { buyerSmartCartExamples, getBuyerSmartCartApiData } from "@/lib/api/buyer";
import { getProductById, getProducts } from "@/lib/data";
import type { BuyerSmartCartItem } from "@/lib/workflows";
import type { Product } from "@/types/commerce";

export default function BuyerProductsPage() {
  const example = buyerSmartCartExamples.find((item) => item.id === "meeting-setup") ?? buyerSmartCartExamples[0];
  const data = getBuyerSmartCartApiData({
    buyerId: example.buyerId,
    prompt: example.prompt,
  });
  const selectedProducts = data.result.selectedItems
    .map((item) => ({
      item,
      product: getProductById(item.productId),
    }))
    .filter((entry): entry is { item: BuyerSmartCartItem; product: Product } => Boolean(entry.product));
  const radarProducts = getProducts()
    .filter((product) => !selectedProducts.some((entry) => entry.product.id === product.id))
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-emerald-200/80">Ürün karar ekranı</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            Ürünler neden eşleşti?
          </h2>
          <p className="mt-5 max-w-[68ch] text-sm leading-7 text-zinc-500">
            Bu görünüm Buyer Smart Cart çıktısını ürün seviyesine indirir: rol, güven, teslimat ve yorum
            sürtünmesi aynı satırda okunur.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Canlı demo promptu</p>
          <p className="mt-4 text-xl font-medium leading-8 tracking-[-0.03em] text-white">{data.request.prompt}</p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
            <Metric label="Intent" value={data.summary.intentLabel} />
            <Metric label="Güven" value={`${data.summary.confidenceScore}/100`} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Eşleşen ürünler</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Her satır bir sepet rolünü, ürün kararını ve satın alma sürtünmesini taşır.
              </p>
            </div>
            <p className="font-mono text-sm text-emerald-100">{selectedProducts.length} ürün</p>
          </div>

          <div className="divide-y divide-white/10">
            {selectedProducts.map(({ item, product }) => (
              <article key={item.productId} className="grid gap-4 py-5 lg:grid-cols-[180px_1fr_150px]">
                <div>
                  <p className="text-sm text-emerald-200/80">{item.cartRole}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{product.brand} · {product.subcategory}</p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-white">{product.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.reasons[0]}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <SmallMetric label="Teslimat" value={`${product.fulfillment.deliveryPromiseDays} gün`} />
                    <SmallMetric label="Yorum" value={`${product.metrics.ratingAverage.toFixed(1)}/5`} />
                    <SmallMetric label="Güven" value={`${item.confidenceScore}/100`} />
                  </div>
                </div>
                <div className="font-mono text-lg tracking-[-0.04em] text-white">{formatTry(item.price)}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <DecisionPanel title="Satın alma uyarıları">
            {data.result.warnings.slice(0, 4).map((warning) => (
              <div key={`${warning.title}-${warning.productId ?? "workflow"}`} className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-white">{warning.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{warning.message}</p>
              </div>
            ))}
          </DecisionPanel>

          <DecisionPanel title="Satıcıya dönen sinyal">
            {data.result.sellerSignalCandidates.slice(0, 4).map((signal) => (
              <div key={`${signal.type}-${signal.summary}`} className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-white">{getSignalLabel(signal.type)}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{signal.summary}</p>
              </div>
            ))}
          </DecisionPanel>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Katalog radarı</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Seçilmeyen ürünler burada hızlı karşılaştırma için açık satır olarak kalır.
            </p>
          </div>
          <p className="font-mono text-sm text-zinc-500">{radarProducts.length} aday</p>
        </div>

        <div className="mt-2 divide-y divide-white/10">
          {radarProducts.map((product) => (
            <div key={product.id} className="grid gap-4 py-4 md:grid-cols-[1fr_130px_110px_110px]">
              <div>
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{product.category} · {product.catalog.useCases.slice(0, 2).join(", ")}</p>
              </div>
              <p className="font-mono text-sm text-zinc-300">{formatTry(product.price)}</p>
              <p className="text-sm text-zinc-500">{product.fulfillment.deliveryPromiseDays} gün</p>
              <p className="font-mono text-sm text-emerald-200/80">{product.metrics.ratingAverage.toFixed(1)}/5</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/55 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-medium tracking-[-0.03em] text-white">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 pt-3">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 font-mono text-sm text-zinc-300">{value}</p>
    </div>
  );
}

function DecisionPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-6">
      <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">{title}</h3>
      <div className="mt-5 space-y-4">{children}</div>
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

function getSignalLabel(type: string): string {
  const labels: Record<string, string> = {
    bundle_opportunity: "Bundle fırsatı",
    buyer_demand: "Talep sinyali",
    color_demand: "Renk talebi",
    review_friction: "Yorum sürtünmesi",
    shipping_friction: "Kargo sürtünmesi",
  };

  return labels[type] ?? type;
}
