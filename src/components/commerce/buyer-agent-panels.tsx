"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CheckCircle,
  Robot,
  ShoppingCartSimple,
} from "@phosphor-icons/react";
import type {
  BuyerAgentApiData,
  BuyerAgentApplyStrategy,
  BuyerAgentRecommendation,
} from "@/lib/api/buyer-agent";

export type BuyerAgentApplyState =
  | { status: "idle"; message?: undefined; strategy?: undefined; itemCount?: undefined }
  | { status: "loading"; message?: undefined; strategy: BuyerAgentApplyStrategy; itemCount?: undefined }
  | {
      cartItemCount: number;
      itemCount: number;
      message: string;
      productCount: number;
      status: "applied";
      storageEvent: string;
      strategy: BuyerAgentApplyStrategy;
      strategyLabel: string;
      toolId: string;
    }
  | { status: "error"; message: string; strategy?: undefined; itemCount?: undefined };

export function BuyerAgentConversationPanel({
  data,
  isLoading,
}: {
  data: BuyerAgentApiData;
  isLoading: boolean;
}) {
  return (
    <aside
      data-agent-reveal
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Agent cevabı</h2>
          <p className="mt-1 text-sm text-slate-500">Katalog dışı ürün uydurmaz.</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-[#fff]">
          <Robot size={20} weight="duotone" />
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <BuyerAgentChatBubble tone="user">{data.request.prompt}</BuyerAgentChatBubble>
        {isLoading ? (
          <div className="space-y-3 rounded-lg bg-slate-100 p-4">
            <div className="commerce-skeleton h-4 w-4/5 rounded-full bg-slate-200" />
            <div className="commerce-skeleton h-4 w-3/5 rounded-full bg-slate-200" />
          </div>
        ) : (
          <BuyerAgentChatBubble tone="agent">
            {data.message.content}
            <span className="mt-3 block font-semibold text-slate-950">{data.message.confirmationQuestion}</span>
          </BuyerAgentChatBubble>
        )}
      </div>
    </aside>
  );
}

export function BuyerRecommendationCard({
  index,
  recommendation,
}: {
  index: number;
  recommendation: BuyerAgentRecommendation;
}) {
  const product = recommendation.product;

  return (
    <article
      data-agent-reveal
      className="group grid min-h-[248px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 md:grid-cols-[168px_1fr]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        href={product.href}
        aria-label={`${product.name} ürün detayını aç`}
        className="block overflow-hidden bg-white"
      >
        <div
          aria-label={product.image.alt}
          className="h-full min-h-44 bg-[length:600%_800%] bg-no-repeat transition duration-700 group-hover:scale-105"
          role="img"
          style={{
            backgroundImage: `url(${product.image.src})`,
            backgroundPosition: product.image.position,
          }}
        />
      </Link>
      <div className="flex min-w-0 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-orange-600">{product.brand}</p>
            <Link
              href={product.href}
              className="mt-1 line-clamp-2 block text-base font-semibold leading-6 text-slate-950 hover:text-orange-700"
            >
              {product.name}
            </Link>
          </div>
          <p className="shrink-0 text-base font-semibold tracking-[-0.04em] text-slate-950">{formatTry(product.price)}</p>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{recommendation.primaryReason}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{product.deliveryLabel}</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
            Güven {recommendation.item.confidenceScore}/100
          </span>
        </div>

        {recommendation.warningTitles.length > 0 ? (
          <p className="mt-auto pt-4 text-xs leading-5 text-amber-700">{recommendation.warningTitles[0]}</p>
        ) : (
          <p className="mt-auto pt-4 text-xs leading-5 text-slate-500">{recommendation.item.cartRole}</p>
        )}
      </div>
    </article>
  );
}

export function BuyerAgentApplyPanel({
  applyState,
  data,
  disabled,
  onApply,
}: {
  applyState: BuyerAgentApplyState;
  data: BuyerAgentApiData;
  disabled: boolean;
  onApply: (strategy: BuyerAgentApplyStrategy) => void;
}) {
  const isApplying = applyState.status === "loading";
  const previewRows = data.applyPreview.items.slice(0, 3).map((item) => ({
    item,
    recommendation: data.recommendations.find((recommendation) => recommendation.product.id === item.productId),
  }));

  return (
    <aside
      data-agent-reveal
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
    >
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Onay</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Agent sepeti sen onaylamadan değiştirmez. İstersen mevcut sepete ekler, istersen seçkiyle değiştirir.
      </p>

      <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
        <BuyerAgentSummaryRow label="Ürün" value={`${data.summary.itemCount} adet`} />
        <BuyerAgentSummaryRow label="Toplam" value={formatTry(data.summary.totalPrice)} />
        <BuyerAgentSummaryRow label="Bütçe" value={data.summary.budgetStatusLabel} />
        <BuyerAgentSummaryRow label="Güven" value={`${data.summary.confidenceScore}/100`} />
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Onay bekleyen sepet</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Ürünler sen butona basmadan sepete yazılmaz.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {previewRows.map(({ item, recommendation }) => (
            <div key={item.productId} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-950">
                  {recommendation?.product.name ?? item.productId}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Onay bekleyen payload</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                x{item.quantity ?? 1}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Sepete ekle mevcut sepeti korur; sepeti değiştir yalnızca bu seçkiyi bırakır.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          disabled={disabled || isApplying}
          onClick={() => onApply("append")}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCartSimple size={18} weight="bold" />
          {isApplying && applyState.strategy === "append" ? "Ekleniyor" : "Sepete Ekle"}
        </button>
        <button
          type="button"
          disabled={disabled || isApplying}
          onClick={() => onApply("replace")}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isApplying && applyState.strategy === "replace" ? "Değiştiriliyor" : "Sepeti Değiştir"}
        </button>
      </div>

      {applyState.status === "applied" ? (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">{applyState.message}</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                {applyState.itemCount} adet, {applyState.productCount} ürün güncellendi. Sepette toplam {applyState.cartItemCount} adet var.
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs leading-5 text-emerald-800 ring-1 ring-emerald-100">
            {applyState.strategyLabel}. Sepete giderek ürünleri düzenleyebilirsin.
          </div>
          <Link
            href="/buyer/cart"
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-semibold text-[#fff] transition hover:bg-emerald-800 active:translate-y-px"
          >
            Sepete Git
          </Link>
        </div>
      ) : null}

      {applyState.status === "error" ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {applyState.message}
        </div>
      ) : null}
    </aside>
  );
}

export function BuyerAgentFaq() {
  const items = [
    {
      answer: "Evet. Öneriler katalogdaki ürünlerle sınırlı kalır ve ürün detayına gidilebilir.",
      question: "Agent gerçek ürün mü öneriyor?",
    },
    {
      answer: "Hayır. Sepete ekleme veya sepeti değiştirme aksiyonu sadece sen butona bastığında çalışır.",
      question: "Sepetim otomatik değişir mi?",
    },
    {
      answer: "Bütçe, teslimat, yorum ve tercih sinyallerini kısa gerekçe olarak gösterir. Teknik trace ve smoke-test kanıtları kullanıcı ekranında tutulmaz.",
      question: "Neden bu ürünleri seçtiğini görebilir miyim?",
    },
  ];

  return (
    <aside
      data-agent-reveal
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
    >
      <h2 className="text-xl font-semibold text-slate-950">Kısa yardım</h2>
      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        {items.map((item) => (
          <details key={item.question} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
              {item.question}
              <span className="text-lg leading-none text-orange-600 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </aside>
  );
}

export function BuyerRecommendationSkeleton() {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid overflow-hidden rounded-lg border border-slate-200 bg-slate-50 md:grid-cols-[168px_1fr]">
          <div className="commerce-skeleton min-h-44 bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="commerce-skeleton h-4 w-24 rounded-full bg-slate-200" />
            <div className="commerce-skeleton h-5 w-full rounded-full bg-slate-200" />
            <div className="commerce-skeleton h-4 w-5/6 rounded-full bg-slate-200" />
            <div className="commerce-skeleton h-4 w-2/3 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BuyerAgentEmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function BuyerAgentChatBubble({ children, tone }: { children: ReactNode; tone: "agent" | "user" }) {
  return (
    <div
      className={
        tone === "user"
          ? "ml-auto max-w-[86%] rounded-lg bg-orange-500 p-4 text-sm font-semibold leading-6 text-[#fff]"
          : "max-w-[88%] rounded-lg bg-slate-100 p-4 text-sm leading-6 text-slate-700"
      }
    >
      {children}
    </div>
  );
}

function BuyerAgentSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-950">{value}</span>
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
