import { getSellerOverview } from "@/lib/data";
import { scoreProduct } from "@/lib/scoring";
import { getProductDetail } from "@/lib/data";

export default function SellerProductsPage() {
  const overview = getSellerOverview("seller-commercepilot");
  const products = overview?.products ?? [];
  const productRows = products.slice(0, 16).map((product) => {
    const detail = getProductDetail(product.id);
    const scorecard = detail ? scoreProduct(detail) : undefined;

    return {
      product,
      scorecard,
      availableStock: product.stock.onHand - product.stock.reserved,
    };
  });

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
        <p className="text-sm text-emerald-200/80">Ürün radarı</p>
        <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
          Her ürün bir karar sinyali taşıyor.
        </h2>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <div className="grid grid-cols-[1.35fr_0.55fr_0.55fr_0.55fr] gap-4 border-b border-white/10 px-5 py-4 text-xs text-zinc-500 md:px-7">
          <span>Ürün</span>
          <span>Sağlık</span>
          <span>Stok</span>
          <span>Satış</span>
        </div>
        <div className="divide-y divide-white/10">
          {productRows.map(({ product, scorecard, availableStock }) => (
            <div
              key={product.id}
              className="grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.025] md:grid-cols-[1.35fr_0.55fr_0.55fr_0.55fr] md:px-7"
            >
              <div>
                <p className="font-medium text-white">{product.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{product.category} · {product.brand}</p>
              </div>
              <Metric value={scorecard ? `${scorecard.health.score}/100` : "-"} helper={scorecard?.health.label ?? "Skor yok"} />
              <Metric value={`${availableStock} adet`} helper={`Eşik: ${product.stock.reorderPoint}`} />
              <Metric value={`${product.metrics.orders30d} sipariş`} helper={`${Math.round(product.metrics.revenue30d).toLocaleString("tr-TR")} TL`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ value, helper }: { value: string; helper: string }) {
  return (
    <div>
      <p className="font-mono text-lg tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{helper}</p>
    </div>
  );
}
