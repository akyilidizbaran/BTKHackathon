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

  const isReviewAttention = data.action.type === "review_attention";
  const visibleReviewHighlights = data.reviewHighlights.slice(0, 3);
  const visibleExecutionSteps = data.executionPreview.steps.slice(0, isReviewAttention ? 3 : 2);
  const visibleEvidenceItems = data.evidenceSnapshot.slice(0, 3);
  const visibleDrafts = data.executionPreview.generatedDrafts.slice(0, isReviewAttention ? 2 : 1);
  const detailSummary = isReviewAttention
    ? "Alıcının üründe gördüğü temel itirazları topla; ürün sayfası ve destek cevabı aynı yönde güncellensin."
    : data.action.summary;
  const detailOutcome = isReviewAttention && visibleReviewHighlights[0]
    ? `Ana sinyal: "${visibleReviewHighlights[0].title}"`
    : data.action.expectedOutcome;

  return (
    <div className="space-y-5">
      <section className="grid items-start gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7">
          <Link href="/seller/actions" className="text-sm font-semibold text-orange-600 transition hover:text-orange-700">
            Aksiyonlara dön
          </Link>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {data.action.categoryLabel}
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
              {data.action.urgencyLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {data.action.timeHorizonLabel}
            </span>
          </div>

          <h2 className="mt-5 max-w-5xl text-[clamp(2.15rem,4vw,3.85rem)] font-semibold leading-[1] tracking-[-0.055em] text-slate-950">
            {data.action.title}
          </h2>
          <p className="mt-5 max-w-[70ch] text-sm leading-7 text-slate-600">
            {detailSummary}
          </p>
          <p className="mt-4 max-w-[70ch] text-sm font-semibold leading-6 text-orange-700">
            {detailOutcome}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-4">
            <Metric label="Öncelik" value={`${data.action.priorityScore}/100`} />
            <Metric label="Etki" value={data.action.impactLabel} />
            <Metric label="Efor" value={data.action.effortLabel} />
            <Metric
              label={isReviewAttention ? "Yorum" : "Ürün"}
              value={String(isReviewAttention ? visibleReviewHighlights.length : data.affectedProducts.length)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7">
          <p className="text-sm font-semibold text-slate-950">Etkilenen ürünler</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Aksiyonun doğrudan dokunduğu ürünler.
          </p>

          <div className="mt-5 divide-y divide-slate-200">
            {data.affectedProducts.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="grid gap-3 py-4 transition hover:bg-slate-50 md:grid-cols-[1fr_100px]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.brand} · {product.stockStatusLabel}</p>
                </div>
                <p className="font-mono text-sm font-semibold text-orange-700">{product.healthScore}/100</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {isReviewAttention ? "Görünen yorumlar" : "Yapılacak iş"}
              </h3>
              <p className="mt-2 max-w-[68ch] text-sm leading-7 text-slate-500">
                {isReviewAttention
                  ? "Bu aksiyonun nedeni olan müşteri itirazları."
                  : "Satıcının bugün uygulayacağı kısa akış."}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              Sahip: {data.executionPreview.primaryOwner}
            </span>
          </div>

          {isReviewAttention ? (
            <div className="mt-5 grid gap-3">
              {visibleReviewHighlights.map((review) => (
                <ReviewHighlightCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-200">
              {visibleExecutionSteps.map((step) => (
                <div key={step.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_112px]">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{step.detail}</p>
                  </div>
                  <p className="rounded-full bg-orange-50 px-3 py-2 text-center text-xs font-semibold leading-5 text-orange-700">
                    {step.priorityLabel}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {isReviewAttention ? "Kısa aksiyon" : "Sinyal"}
          </h3>
          {isReviewAttention ? (
            <div className="mt-5 grid gap-3">
              {visibleExecutionSteps.map((step) => (
                <div key={step.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{step.detail}</p>
                  <p className="mt-3 text-xs font-semibold text-orange-700">{step.priorityLabel}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-200">
              {visibleEvidenceItems.map((item) => (
                <div key={`${item.label}-${item.value}`} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                    <p className={item.tone === "warning" ? "font-mono text-sm font-semibold text-orange-700" : "font-mono text-sm font-semibold text-emerald-700"}>
                      {item.value}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Hazır metin</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ürün sayfası veya destek cevabı için kısa öneri.
          </p>
          <div className="mt-5 divide-y divide-slate-200">
            {visibleDrafts.map((draft) => (
              <div key={draft.label} className="py-4">
                <p className="text-sm font-semibold text-slate-700">{draft.label}</p>
                <p className="mt-2 line-clamp-4 text-sm font-medium leading-6 text-slate-950">{draft.body}</p>
                <p className="mt-3 text-xs font-semibold text-orange-700">{draft.helper}</p>
              </div>
            ))}
          </div>
        </div>

        <SellerActionExplanationPanel actionId={data.action.id} />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
    </div>
  );
}

function ReviewHighlightCard({
  review,
}: {
  review: {
    body: string;
    createdAt: string;
    id: string;
    rating: number;
    sentimentLabel: string;
    themeLabels: string[];
    title: string;
  };
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
          {review.sentimentLabel}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
          {review.rating}/5
        </span>
        <span className="text-xs text-slate-500">{review.createdAt}</span>
      </div>
      <p className="mt-4 text-base font-semibold tracking-[-0.03em] text-slate-950">{review.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{review.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {review.themeLabels.map((theme) => (
          <span key={`${review.id}-${theme}`} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">
            {theme}
          </span>
        ))}
      </div>
    </article>
  );
}
