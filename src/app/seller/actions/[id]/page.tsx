import Link from "next/link";
import { notFound } from "next/navigation";
import { SellerActionExplanationPanel } from "@/components/commerce/seller-action-explanation-panel";
import { SellerActionsWorkspace } from "@/components/commerce/seller-actions-workspace";
import {
  getSellerActionDetailApiData,
  getSellerActionsApiData,
  resolveSellerActionsFocus,
} from "@/lib/api/seller";

export function generateStaticParams(): Array<{ id: string }> {
  const actionsData = getSellerActionsApiData();

  if (!actionsData) {
    return [];
  }

  const actionParams = actionsData.actionCards.map((card) => ({ id: card.id }));
  const categoryParams = actionsData.segments
    .filter((segment) => segment.id !== "all")
    .map((segment) => ({ id: segment.id }));

  return [...actionParams, ...categoryParams];
}

export default async function SellerActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const focus = resolveSellerActionsFocus(id);

  if (focus) {
    const actionsData = getSellerActionsApiData();

    if (!actionsData) {
      notFound();
    }

    return <SellerActionsWorkspace key={focus} data={actionsData} initialFocus={focus} />;
  }

  const data = getSellerActionDetailApiData(id);

  if (!data) {
    notFound();
  }

  const factEntries = Object.entries(data.llmReadyContext.facts).slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <Link href="/seller/actions" className="text-sm text-emerald-200 transition hover:text-emerald-100">
            Aksiyonlara dön
          </Link>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">
              {data.action.categoryLabel}
            </span>
            <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-emerald-200">
              {data.action.urgencyLabel}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">
              {data.action.timeHorizonLabel}
            </span>
          </div>

          <h2 className="mt-5 max-w-5xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            {data.action.title}
          </h2>
          <p className="mt-5 max-w-[70ch] text-sm leading-7 text-zinc-500">{data.action.summary}</p>
          <p className="mt-5 max-w-[70ch] text-sm leading-7 text-emerald-100/85">
            {data.action.expectedOutcome}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
            <Metric label="Öncelik" value={`${data.action.priorityScore}/100`} />
            <Metric label="Etki" value={data.action.impactLabel} />
            <Metric label="Efor" value={data.action.effortLabel} />
            <Metric label="Ürün" value={String(data.affectedProducts.length)} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Endpoint izi</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 font-mono text-xs leading-6 text-zinc-500">
            {data.contract.method} {data.contract.endpoint}
            <br />
            envelope: {data.contract.envelope}
            <br />
            source: {data.contract.source}
          </div>

          <div className="mt-6 divide-y divide-white/10">
            {data.affectedProducts.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="grid gap-3 py-4 transition hover:bg-white/[0.025] md:grid-cols-[1fr_100px]"
              >
                <div>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{product.brand} · {product.stockStatusLabel}</p>
                </div>
                <p className="font-mono text-sm text-emerald-200/80">{product.healthScore}/100</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                {data.executionPreview.title}
              </h3>
              <p className="mt-2 max-w-[68ch] text-sm leading-7 text-zinc-500">
                {data.executionPreview.summary}
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
              Sahip: {data.executionPreview.primaryOwner}
            </span>
          </div>

          <div className="mt-5 divide-y divide-white/10">
            {data.executionPreview.steps.map((step, index) => (
              <div key={step.id} className="grid gap-4 py-5 md:grid-cols-[96px_1fr_120px]">
                <p className="font-mono text-3xl tracking-[-0.06em] text-white">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div>
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{step.detail}</p>
                </div>
                <div className="text-xs leading-5 text-zinc-500">
                  <p className="text-emerald-200/80">{step.priorityLabel}</p>
                  <p className="mt-2">Sahip: {step.owner}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Kanıt çizgisi</h3>
          <div className="mt-5 divide-y divide-white/10">
            {data.evidenceSnapshot.slice(0, 6).map((item) => (
              <div key={`${item.label}-${item.value}`} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-zinc-500">{item.label}</p>
                  <p className={item.tone === "warning" ? "font-mono text-sm text-amber-200" : "font-mono text-sm text-emerald-200/80"}>
                    {item.value}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Hazır taslaklar</h3>
          <div className="mt-5 divide-y divide-white/10">
            {data.executionPreview.generatedDrafts.map((draft) => (
              <div key={draft.label} className="py-4">
                <p className="text-sm text-zinc-500">{draft.label}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-white">{draft.body}</p>
                <p className="mt-3 text-xs text-emerald-200/80">{draft.helper}</p>
              </div>
            ))}
          </div>
        </div>

        <SellerActionExplanationPanel actionId={data.action.id} />
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
        <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end">
          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">LLM-ready context</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Model açıklama endpointi bu deterministik contexti kullanır; build sırasında LLM çağrısı yapılmaz.
            </p>
          </div>
          <p className="font-mono text-xs text-zinc-500">{data.llmReadyContext.task}</p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="divide-y divide-white/10">
            {factEntries.map(([key, value]) => (
              <div key={key} className="py-3">
                <p className="font-mono text-xs text-zinc-500">{key}</p>
                <p className="mt-2 text-sm leading-6 text-white">{formatFactValue(value)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm text-zinc-500">Instruction</p>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{data.llmReadyContext.instruction}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Alıcıdan gelen bağlam</h3>
          <div className="mt-5 divide-y divide-white/10">
            {data.relatedBuyerSignals.length > 0 ? (
              data.relatedBuyerSignals.map((signal) => (
                <div key={signal.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-white">{signal.typeLabel}</p>
                    <p className="font-mono text-xs text-emerald-200/80">{signal.priorityScore}/100</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{signal.summary}</p>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">{signal.sourcePrompt}</p>
                </div>
              ))
            ) : (
              <EmptyPanel
                title="Buyer sinyali yok"
                description="Bu aksiyon henüz buyer smart cart sinyaliyle doğrudan eşleşmiyor."
              />
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Checklist</h3>
          <div className="mt-5 divide-y divide-white/10">
            {data.action.todayChecklist.map((item) => (
              <div key={item.label} className="py-4">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{item.detail}</p>
                <p className="mt-3 text-xs text-emerald-200/80">Sahip: {item.owner}</p>
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

function formatFactValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 4).map((item) => formatFactValue(item)).join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return "Yok";
}
