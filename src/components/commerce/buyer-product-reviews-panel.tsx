"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Star,
} from "@phosphor-icons/react";

export interface BuyerProductReviewItem {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  metaLabel: string;
  rating?: number;
  sentimentLabel?: string;
  chips: string[];
  tone: "attention" | "note" | "review";
}

interface BuyerProductReviewsPanelProps {
  items: BuyerProductReviewItem[];
  totalReviewCount: number;
}

const reviewsPerPage = 4;

export function BuyerProductReviewsPanel({
  items,
  totalReviewCount,
}: BuyerProductReviewsPanelProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / reviewsPerPage));
  const safePage = Math.min(page, pageCount);
  const visibleItems = useMemo(
    () => items.slice((safePage - 1) * reviewsPerPage, safePage * reviewsPerPage),
    [items, safePage],
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Yorumlar</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 md:text-3xl">Ürün yorumları</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {totalReviewCount.toLocaleString("tr-TR")} değerlendirme içinden alıcı yorumları ve ürün notları.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
          Sayfa {safePage}/{pageCount}
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {visibleItems.map((item) => (
          <article key={item.id} className="py-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceBadgeClass(item.tone)}`}>
                  {item.sourceLabel}
                </span>
                <span className="text-xs text-slate-500">{item.metaLabel}</span>
                {item.sentimentLabel ? (
                  <span className="text-xs font-semibold text-slate-500">{item.sentimentLabel}</span>
                ) : null}
              </div>
              {item.rating ? <RatingStars rating={item.rating} /> : null}
            </div>

            <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">{item.title}</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{item.body}</p>

            {item.chips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.chips.slice(0, 5).map((chip) => (
                  <span key={`${item.id}-${chip}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {items.length > reviewsPerPage ? (
        <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            {items.length} kayıt, her sayfada {reviewsPerPage} yorum/not.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ArrowLeft size={15} weight="bold" />
              Önceki
            </button>
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
            >
              Sonraki
              <ArrowRight size={15} weight="bold" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      <Star size={14} weight="fill" />
      {rating.toFixed(1)}
    </div>
  );
}

function getSourceBadgeClass(tone: BuyerProductReviewItem["tone"]): string {
  const classes: Record<BuyerProductReviewItem["tone"], string> = {
    attention: "bg-red-50 text-red-700",
    note: "bg-slate-100 text-slate-700",
    review: "bg-emerald-50 text-emerald-700",
  };

  return classes[tone];
}
