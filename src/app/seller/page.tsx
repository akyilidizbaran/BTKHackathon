import Link from "next/link";
import { getSellerOverview } from "@/lib/data";
import { generateSellerActionsWorkflow } from "@/lib/workflows";

const sellerId = "seller-commercepilot";

export default function SellerOverviewPage() {
  const overview = getSellerOverview(sellerId);
  const workflow = generateSellerActionsWorkflow(sellerId);
  const actions = workflow?.actions ?? [];
  const products = overview?.products ?? [];
  const totalRevenue = products.reduce((sum, product) => sum + product.metrics.revenue30d, 0);
  const lowStockProducts = products.filter((product) => {
    return product.stock.onHand - product.stock.reserved <= product.stock.reorderPoint;
  });
  const attentionActions = actions.filter((action) => action.timeHorizon === "today");

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm text-emerald-200/80">CommercePilot Demo Store</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
                Bugün satışları iyileştirecek aksiyonları seç.
              </h2>
            </div>
            <Link
              href="/seller/actions"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-300 px-5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-200 active:translate-y-px"
            >
              Aksiyonları aç
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
            <Metric label="Analiz edilen ürün" value={String(workflow?.analyzedProductCount ?? products.length)} />
            <Metric label="Bugün ele alınacak" value={String(attentionActions.length)} />
            <Metric label="Stok riski" value={String(lowStockProducts.length)} />
            <Metric label="30 gün gelir" value={`${Math.round(totalRevenue).toLocaleString("tr-TR")} TL`} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Sistem durumu</p>
          <div className="mt-5 space-y-4">
            <Signal label="Mock veri" value="40 ürün, 55 yorum" tone="good" />
            <Signal label="Workflow" value="Seller + Buyer hazır" tone="good" />
            <Signal label="LLM" value="Sonraki fazda bağlanacak" tone="calm" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                Bugünün satıcı aksiyonları
              </h2>
              <p className="mt-2 text-sm text-zinc-500">Öncelik, etki ve yapılacak iş bazında sıralandı.</p>
            </div>
            <Link href="/seller/actions" className="text-sm text-emerald-200 transition hover:text-emerald-100">
              Tümünü gör
            </Link>
          </div>

          <div className="divide-y divide-white/10">
            {actions.slice(0, 4).map((action) => (
              <Link
                key={action.id}
                href="/seller/actions"
                className="group grid gap-4 py-5 transition hover:bg-white/[0.025] md:grid-cols-[1fr_180px]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">
                      {action.categoryLabel}
                    </span>
                    <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-emerald-200">
                      {action.urgencyLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-medium tracking-[-0.03em] text-white">{action.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{action.expectedOutcome}</p>
                </div>
                <div className="grid content-between gap-3 text-sm">
                  <span className="font-mono text-2xl tracking-[-0.04em] text-white">
                    {action.priorityScore}/100
                  </span>
                  <span className="text-zinc-500">{action.impactLabel} · {action.timeHorizonLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Operasyon sinyali</h2>
          <div className="mt-6 space-y-4">
            {actions.slice(0, 3).map((action) => (
              <div key={action.id} className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-white">{action.categoryLabel}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {action.metricHighlights[0]?.label}: {action.metricHighlights[0]?.value}
                </p>
              </div>
            ))}
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
      <p className="mt-2 font-mono text-xl font-medium tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function Signal({ label, value, tone }: { label: string; value: string; tone: "good" | "calm" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={tone === "good" ? "text-sm text-emerald-200" : "text-sm text-zinc-500"}>{value}</span>
    </div>
  );
}
