import { generateSellerActionsWorkflow } from "@/lib/workflows";

export default function SellerActionsPage() {
  const workflow = generateSellerActionsWorkflow("seller-commercepilot");
  const actions = workflow?.actions ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
        <div className="max-w-4xl">
          <p className="text-sm text-emerald-200/80">Büyüme aksiyonları</p>
          <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            Satıcı için yapılacak işler netleşti.
          </h2>
          <p className="mt-5 max-w-[62ch] text-sm leading-7 text-zinc-500">
            Bu liste şu an deterministic workflow çıktısıdır. LLM katmanı geldiğinde aynı kanıtlar
            daha doğal açıklamalara ve aksiyon planlarına çevrilecek.
          </p>
        </div>
      </section>

      <section className="grid gap-5">
        {actions.map((action) => (
          <article
            key={action.id}
            className="grid gap-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl lg:grid-cols-[1fr_420px] md:p-7"
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
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">{action.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500">{action.summary}</p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-emerald-100/85">{action.expectedOutcome}</p>

              <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
                {action.metricHighlights.map((metric) => (
                  <div key={`${action.id}-${metric.label}`} className="bg-zinc-950/55 p-4">
                    <p className="text-xs text-zinc-500">{metric.label}</p>
                    <p className="mt-2 font-mono text-lg tracking-[-0.04em] text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-950/45 p-5">
              <p className="text-sm text-zinc-500">Checklist</p>
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
          </article>
        ))}
      </section>
    </div>
  );
}
