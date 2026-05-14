import Link from "next/link";
import { getSellerBuyerSignalsApiData, getSellerOverviewApiData } from "@/lib/api/seller";
import type { SellerBuyerSignalsApiData } from "@/lib/api/seller";

export default function SellerOverviewPage() {
  const data = getSellerOverviewApiData();
  const buyerSignals = getSellerBuyerSignalsApiData();

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
            <Metric label="Alıcı sinyali" value={String(buyerSignals?.summary.signalCount ?? 0)} />
            <Metric label="30 gün gelir" value={formatTry(data.stats.totalRevenue30d)} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">API contract</p>
          <div className="mt-5 space-y-4">
            <Signal label="Envelope" value={data.contract.envelope} tone="good" />
            <Signal label="Kaynak" value={data.contract.source} tone="calm" />
            <Signal label="Seller" value={data.contract.sellerId} tone="calm" />
            <Signal label="Buyer loop" value={buyerSignals ? "Aktif" : "Bekliyor"} tone={buyerSignals ? "good" : "calm"} />
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 font-mono text-xs leading-6 text-zinc-500">
            GET /api/seller/overview
            <br />
            GET /api/seller/actions
            <br />
            GET /api/seller/products
            <br />
            GET /api/seller/buyer-signals
          </div>
        </div>
      </section>

      {buyerSignals ? (
        <BuyerSignalsSection data={buyerSignals} />
      ) : (
        <EmptyPanel
          title="Alıcı sinyali üretilemedi"
          description="Buyer Smart Cart örnekleri seller tarafına bağlanamadı. Buyer workflow ve seller product referansları kontrol edilmeli."
        />
      )}

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

function BuyerSignalsSection({ data }: { data: SellerBuyerSignalsApiData }) {
  const topSignals = data.signals.slice(0, 4);
  const promptSnapshots = data.promptSnapshots.slice(0, 3);

  return (
    <section className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
      <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm text-emerald-200/80">Buyer-to-seller loop</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-[0.95] tracking-[-0.055em] text-white md:text-4xl">
            Alıcı komutları satıcı sinyaline dönüştü.
          </h2>
          <p className="mt-4 max-w-[72ch] text-sm leading-7 text-zinc-500">{data.loopNarrative}</p>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-2 font-mono text-xs text-zinc-400">
          {data.contract.method} {data.contract.endpoint}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
        <Metric label="Prompt" value={String(data.summary.promptCount)} />
        <Metric label="Sinyal" value={String(data.summary.signalCount)} />
        <Metric label="Ürün etkisi" value={String(data.summary.affectedProductCount)} />
        <Metric label="Ortalama öncelik" value={`${data.summary.averagePriorityScore}/100`} />
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[0.72fr_1.28fr]">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold tracking-[-0.035em] text-white">Prompt kaynakları</h3>
            <span className="text-xs text-zinc-500">{data.summary.typeCoverage.length} sinyal tipi</span>
          </div>
          <div className="mt-5 divide-y divide-white/10">
            {promptSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="py-4 first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-white">{snapshot.label}</p>
                  <p className="font-mono text-xs text-emerald-200/80">{snapshot.confidenceScore}/100</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{snapshot.prompt}</p>
                <p className="mt-3 text-xs text-zinc-500">
                  {snapshot.intentLabel} · {formatTry(snapshot.totalPrice)} · {snapshot.signalCount} sinyal
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {data.summary.typeCoverage.map((coverage) => (
              <span
                key={coverage.type}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400"
              >
                {coverage.label}: {coverage.count}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold tracking-[-0.035em] text-white">Satıcıya yansıyan sinyaller</h3>
            <span className="text-xs text-zinc-500">{data.summary.highPrioritySignalCount} yüksek öncelik</span>
          </div>
          <div className="mt-5 divide-y divide-white/10">
            {topSignals.map((signal) => (
              <article key={signal.id} className="grid gap-4 py-5 first:pt-0 lg:grid-cols-[168px_1fr_230px]">
                <div>
                  <p className="font-mono text-3xl tracking-[-0.06em] text-white">{signal.priorityScore}</p>
                  <p className="mt-2 text-xs text-emerald-200/80">{signal.priorityLabel}</p>
                  <p className="mt-3 text-xs text-zinc-500">{signal.typeLabel}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">{signal.summary}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{signal.sourcePrompt}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {signal.affectedProducts.slice(0, 3).map((product) => (
                      <Link
                        key={`${signal.id}-${product.id}`}
                        href={product.href}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 transition hover:border-emerald-200/30 hover:text-emerald-100"
                      >
                        {product.name} · {product.healthScore}/100
                      </Link>
                    ))}
                    {signal.affectedProducts.length > 3 ? (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">
                        +{signal.affectedProducts.length - 3} ürün
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">Önerilen hamle</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/85">{signal.sellerActionHint}</p>
                  {signal.matchedSellerActions[0] ? (
                    <p className="mt-4 text-xs leading-5 text-zinc-500">
                      Bağlı aksiyon: {signal.matchedSellerActions[0].title}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
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
