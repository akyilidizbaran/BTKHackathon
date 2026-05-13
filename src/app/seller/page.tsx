import Link from "next/link";
import { getSellerOverviewApiData } from "@/lib/api/seller";

export default function SellerOverviewPage() {
  const data = getSellerOverviewApiData();

  if (!data) {
    return (
      <EmptyPanel
        title="Satıcı verisi bulunamadı"
        description="Demo satıcı contract’ı üretilemedi. Mock seller ve workflow referansları kontrol edilmeli."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm text-emerald-200/80">{data.seller.displayName}</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
                Bugün satışları iyileştirecek aksiyonları seç.
              </h2>
              <p className="mt-5 max-w-[62ch] text-sm leading-7 text-zinc-500">
                Seller ekranları artık aynı API contract shape üzerinden okunuyor: route handler’lar
                `success`, `data` ve `error` envelope yapısını döndürüyor.
              </p>
            </div>
            <Link
              href="/seller/actions"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-300 px-5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-200 active:translate-y-px"
            >
              Aksiyonları aç
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
            <Metric label="Analiz edilen ürün" value={String(data.stats.analyzedProductCount)} />
            <Metric label="Bugün ele alınacak" value={String(data.stats.attentionActionCount)} />
            <Metric label="Stok riski" value={String(data.stats.lowStockProductCount)} />
            <Metric label="30 gün gelir" value={formatTry(data.stats.totalRevenue30d)} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">API contract</p>
          <div className="mt-5 space-y-4">
            <Signal label="Envelope" value={data.contract.envelope} tone="good" />
            <Signal label="Kaynak" value={data.contract.source} tone="calm" />
            <Signal label="Seller" value={data.contract.sellerId} tone="calm" />
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 font-mono text-xs leading-6 text-zinc-500">
            GET /api/seller/overview
            <br />
            GET /api/seller/actions
            <br />
            GET /api/seller/products
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
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

          {data.topActions.length > 0 ? (
            <div className="divide-y divide-white/10">
              {data.topActions.slice(0, 4).map((action) => (
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
                    <span className="text-zinc-500">
                      {action.impactLabel} · {action.timeHorizonLabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Bugün aksiyon yok"
              description="Workflow şu an satıcı için yüksek öncelikli bir iş üretmedi."
            />
          )}
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Operasyon sinyali</h2>
          <div className="mt-6 space-y-4">
            {data.operationSignals.map((signal) => (
              <div key={signal.id} className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-white">{signal.categoryLabel}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {signal.helper}: {signal.value}
                </p>
                <p className={signal.tone === "warning" ? "mt-3 text-xs text-amber-200" : "mt-3 text-xs text-emerald-200/80"}>
                  {signal.title}
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
