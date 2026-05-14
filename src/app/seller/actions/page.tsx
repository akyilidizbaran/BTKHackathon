import Link from "next/link";
import { getSellerActionsApiData } from "@/lib/api/seller";

export default function SellerActionsPage() {
  const data = getSellerActionsApiData();

  if (!data) {
    return (
      <EmptyPanel
        title="Aksiyon contract’ı üretilemedi"
        description="Satıcı workflow çıktısı yok. Mock seller veya seller action üretimi kontrol edilmeli."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-emerald-200/80">Büyüme aksiyonları</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            Satıcı için yapılacak işler netleşti.
          </h2>
          <p className="mt-5 max-w-[66ch] text-sm leading-7 text-zinc-500">
            Bu sayfa `GET /api/seller/actions` ile aynı contract builder’dan besleniyor. LLM katmanı geldiğinde
            `llmReadyContext` alanı prompt açıklama katmanına taşınacak.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Contract özeti</p>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
            <Metric label="Aksiyon" value={String(data.actions.length)} />
            <Metric label="Ürün" value={String(data.analyzedProductCount)} />
            <Metric label="Tip" value={String(data.actionTypeCoverage.length)} />
            <Metric label="Envelope" value={data.contract.envelope} />
          </div>
        </div>
      </section>

      <section className="grid gap-5">
        {data.actions.length > 0 ? (
          data.actions.map((action, index) => (
            <Link
              key={action.id}
              href={`/seller/actions/${action.id}`}
              className="group grid gap-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition hover:border-emerald-200/20 hover:bg-white/[0.055] lg:grid-cols-[1fr_420px] md:p-7"
            >
              <div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">
                    {action.categoryLabel}
                  </span>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-emerald-200">
                    {action.urgencyLabel}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">
                    {action.timeHorizonLabel}
                  </span>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-[86px_1fr]">
                  <div className="font-mono text-4xl font-medium leading-none tracking-[-0.06em] text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{action.title}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500">{action.summary}</p>
                    <p className="mt-5 max-w-3xl text-sm leading-7 text-emerald-100/85">
                      {action.expectedOutcome}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
                  {action.metricHighlights.map((metric) => (
                    <div key={`${action.id}-${metric.label}`} className="bg-zinc-950/55 p-4">
                      <p className="text-xs text-zinc-500">{metric.label}</p>
                      <p className="mt-2 font-mono text-lg tracking-[-0.04em] text-white">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-950/45 p-5 transition group-hover:border-emerald-200/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Checklist</p>
                    <p className="mt-2 font-mono text-3xl tracking-[-0.06em] text-white">
                      {action.priorityScore}/100
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                    {action.impactLabel} · {action.effortLabel}
                  </div>
                </div>
                <div className="mt-4 divide-y divide-white/10">
                  {action.todayChecklist.map((item) => (
                    <div key={`${action.id}-${item.label}`} className="py-4">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">{item.detail}</p>
                      <p className="mt-3 text-xs text-emerald-200/80">Sahip: {item.owner}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <EmptyPanel
            title="Aksiyon listesi boş"
            description="Şu an satıcı için gösterilecek growth action yok. Veri veya threshold değişince liste dolacaktır."
          />
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

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-zinc-950/35 p-6">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}
