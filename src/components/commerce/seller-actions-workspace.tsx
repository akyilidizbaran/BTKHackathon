"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChartLineUp,
  ChatCircleText,
  FunnelSimple,
  ListChecks,
  MagnifyingGlass,
  Package,
  SlidersHorizontal,
  Storefront,
  TrendDown,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type {
  SellerActionListItem,
  SellerActionsApiData,
  SellerActionsFocusKey,
  SellerActionsSegment,
} from "@/lib/api/seller";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type SortKey = "priority-desc" | "products-desc" | "urgency" | "category";

interface SellerActionsWorkspaceProps {
  data: SellerActionsApiData;
  initialFocus: SellerActionsFocusKey;
}

const sortOptions: Array<{ id: SortKey; label: string }> = [
  { id: "priority-desc", label: "Öncelik yüksek" },
  { id: "urgency", label: "Acil önce" },
  { id: "products-desc", label: "Ürün yoğun" },
  { id: "category", label: "Kategori" },
];

const focusIconMap: Record<SellerActionsFocusKey, typeof ListChecks> = {
  all: Storefront,
  campaign: ChartLineUp,
  content: ListChecks,
  "customer-voice": ChatCircleText,
  growth: ChartLineUp,
  inventory: Package,
  "negative-reviews": ChatCircleText,
  operations: WarningCircle,
  profitability: ChartLineUp,
  "return-risk": ListChecks,
  returns: ListChecks,
  "slow-movers": TrendDown,
  "stock-risk": Package,
};

export function SellerActionsWorkspace({ data, initialFocus }: SellerActionsWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeFocus, setActiveFocus] = useState<SellerActionsFocusKey>(initialFocus);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("priority-desc");
  const [selectedActionId, setSelectedActionId] = useState<string | undefined>(
    data.actionCards[0]?.id,
  );

  const visibleActionCards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("tr-TR");

    return data.actionCards
      .filter((card) => activeFocus === "all" || card.focusTags.includes(activeFocus))
      .filter((card) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          card.action.title,
          card.action.summary,
          card.action.categoryLabel,
          card.action.urgencyLabel,
          card.action.timeHorizonLabel,
          ...card.affectedProducts.map((product) => product.name),
          ...card.evidence.map((item) => `${item.label} ${item.value} ${item.helper}`),
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);
      })
      .sort((first, second) => sortSellerActionCards(first, second, sortKey));
  }, [activeFocus, data.actionCards, searchQuery, sortKey]);

  const selectedActionCard = useMemo(() => {
    return (
      visibleActionCards.find((card) => card.id === selectedActionId) ??
      visibleActionCards[0] ??
      data.actionCards[0]
    );
  }, [data.actionCards, selectedActionId, visibleActionCards]);

  const activeSegment = data.segments.find((segment) => segment.id === activeFocus) ?? data.segments[0];
  const quickSegments = data.segments.filter((segment) => segment.kind !== "category");

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-seller-actions-reveal]",
        {
          opacity: 0,
          y: 18,
        },
        {
          clearProps: "opacity,transform",
          duration: 0.58,
          ease: "power3.out",
          opacity: 1,
          stagger: 0.045,
          y: 0,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-action-product-media]").forEach((element) => {
        gsap.fromTo(
          element,
          {
            opacity: 0.76,
            scale: 0.92,
          },
          {
            ease: "none",
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              end: "bottom 36%",
              scrub: true,
              start: "top 92%",
              trigger: element,
            },
          },
        );
      });
    },
    {
      dependencies: [activeFocus, searchQuery, sortKey, visibleActionCards.length],
      scope: rootRef,
    },
  );

  function handleFocusChange(segment: SellerActionsSegment) {
    setActiveFocus(segment.id);

    const nextAction = data.actionCards.find((card) => segment.id === "all" || card.focusTags.includes(segment.id));

    if (nextAction) {
      setSelectedActionId(nextAction.id);
    }

    window.history.pushState(null, "", segment.href);
  }

  return (
    <div ref={rootRef} className="overflow-x-hidden">
      <section className="grid grid-flow-dense items-start gap-5 xl:grid-cols-12">
        <div
          data-seller-actions-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] xl:col-span-8 md:p-6"
        >
          <div className="flex flex-col justify-between gap-6">
            <div>
              <h2 className="max-w-5xl text-[clamp(2.05rem,3.5vw,3.45rem)] font-semibold leading-[1] tracking-[-0.05em] text-slate-950">
                Aksiyonları kategoriye göre işlet.
              </h2>
              <p className="mt-4 max-w-[72ch] text-sm leading-6 text-slate-600">
                Stok, yorum, iade ve satılmayan ürün sinyallerini filtrele; satıcının bugün uygulayacağı işi aç.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickSegments.slice(0, 4).map((segment) => (
                <button
                  key={segment.id}
                  type="button"
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:translate-y-px ${
                    activeFocus === segment.id
                      ? "bg-slate-950 text-[#fff] shadow-[0_14px_28px_-22px_rgba(15,23,42,0.9)]"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:text-orange-700"
                  }`}
                  onClick={() => handleFocusChange(segment)}
                >
                  {renderFocusIcon(segment.id, activeFocus === segment.id)}
                  {segment.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside
          data-seller-actions-reveal
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] xl:col-span-4"
        >
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {activeSegment?.label ?? "Tümü"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {activeSegment?.helper ?? "Tüm aksiyonlar aynı görünümde"}
                </p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                <ListChecks size={21} weight="duotone" />
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-200">
              <HeroMetric label="Aksiyon" value={String(data.summary.actionCount)} />
              <HeroMetric label="Görünen" value={String(visibleActionCards.length)} />
              <HeroMetric label="Kategori" value={String(data.summary.categoryCount)} />
              <HeroMetric label="Öncelik" value={`${data.summary.topPriorityScore}/100`} />
            </div>
          </div>
        </aside>

        <aside
          data-seller-actions-reveal
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] xl:col-span-3 md:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Aksiyon kategorileri</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Kuyruğu iş tipine göre daralt.</p>
            </div>
            <FunnelSimple className="text-orange-500" size={22} weight="duotone" />
          </div>

          <div className="mt-5 grid gap-2">
            {data.categoryRoutes.map((segment) => (
              <button
                key={segment.id}
                type="button"
                className={`group rounded-lg border p-3 text-left transition hover:-translate-y-0.5 active:translate-y-px ${
                  activeFocus === segment.id
                    ? "border-orange-300 bg-orange-50 ring-4 ring-orange-100"
                    : "border-slate-200 bg-white hover:border-orange-200"
                }`}
                onClick={() => handleFocusChange(segment)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                    {renderFocusIcon(segment.id, activeFocus === segment.id)}
                    {segment.label}
                  </span>
                  <span className="font-mono text-sm text-slate-500">{segment.actionCount}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{segment.helper}</p>
              </button>
            ))}
          </div>
        </aside>

        <div data-seller-actions-reveal className="min-w-0 xl:col-span-6">
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
            <label className="relative block" htmlFor="seller-actions-search">
              <span className="sr-only">Aksiyon ara</span>
              <MagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
                weight="bold"
              />
              <input
                id="seller-actions-search"
                aria-label="Aksiyon ara"
                className="h-11 w-full rounded-full border border-slate-200 bg-white px-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                placeholder="Aksiyon, ürün veya sinyal ara"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Aramayı temizle"
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={15} weight="bold" />
                </button>
              ) : null}
            </label>

            <label className="relative block" htmlFor="seller-actions-sort">
              <span className="sr-only">Sıralama</span>
              <SlidersHorizontal
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
                weight="duotone"
              />
              <select
                id="seller-actions-sort"
                aria-label="Aksiyon sıralaması"
                className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white px-11 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visibleActionCards.length > 0 ? (
            <div className="grid grid-flow-dense gap-3">
              {visibleActionCards.map((card) => (
                <ActionQueueCard
                  key={card.id}
                  card={card}
                  isSelected={selectedActionCard?.id === card.id}
                  onSelect={() => setSelectedActionId(card.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyActionsState
              searchQuery={searchQuery}
              onReset={() => {
                setSearchQuery("");
                const allSegment = data.segments.find((segment) => segment.id === "all");

                if (allSegment) {
                  handleFocusChange(allSegment);
                }
              }}
            />
          )}
        </div>

        <aside data-seller-actions-reveal className="xl:col-span-3">
          {selectedActionCard ? <SelectedActionRail card={selectedActionCard} /> : null}
        </aside>
      </section>
    </div>
  );
}

function ActionQueueCard({
  card,
  isSelected,
  onSelect,
}: {
  card: SellerActionListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const previewProducts = card.affectedProducts.slice(0, 2);

  return (
    <article
      data-seller-actions-reveal
      className={`group rounded-lg border bg-white p-3 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_24px_58px_-44px_rgba(15,23,42,0.68)] ${
        isSelected ? "border-orange-300 ring-4 ring-orange-100" : "border-slate-200"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_118px]">
        <button type="button" className="min-w-0 text-left" onClick={onSelect}>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {card.action.categoryLabel}
            </span>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
              {card.action.urgencyLabel}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {card.action.timeHorizonLabel}
            </span>
          </div>

          <h3 className="mt-4 text-xl font-semibold leading-tight tracking-[-0.035em] text-slate-950">
            {card.action.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{card.action.summary}</p>
        </button>

        <div className="flex gap-2 lg:flex-col">
          <button
            type="button"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            onClick={onSelect}
          >
            Seç
          </button>
          <Link
            href={card.href}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-3 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
          >
            Detay
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_138px]">
        <div className="grid gap-2 sm:grid-cols-3">
          {card.evidence.map((item) => (
            <ActionEvidenceMetric key={`${card.id}-${item.label}`} item={item} />
          ))}
        </div>

        <div className="flex items-center gap-2 lg:justify-end">
          {previewProducts.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              aria-label={`${product.name} ürün detayını aç`}
              className="block h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              title={product.name}
            >
              <span
                data-action-product-media
                aria-label={product.image.alt}
                className="block h-full w-full bg-[length:500%_400%] bg-no-repeat transition duration-700 ease-out group-hover:scale-105"
                role="img"
                style={{
                  backgroundImage: `url(${product.image.src})`,
                  backgroundPosition: product.image.position,
                }}
              />
            </Link>
          ))}
          <span className="font-mono text-xs text-slate-400">{card.action.priorityScore}/100</span>
        </div>
      </div>
    </article>
  );
}

function SelectedActionRail({ card }: { card: SellerActionListItem }) {
  const product = card.primaryProduct;

  return (
    <div className="sticky top-5 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
      {product ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div
            data-action-product-media
            aria-label={product.image.alt}
            className="aspect-[4/3] bg-[length:500%_400%] bg-no-repeat"
            role="img"
            style={{
              backgroundImage: `url(${product.image.src})`,
              backgroundPosition: product.image.position,
            }}
          />
        </div>
      ) : null}

      <p className="mt-4 text-xs font-semibold text-orange-600">{card.action.categoryLabel}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {card.action.title}
      </h2>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{card.action.expectedOutcome}</p>

      <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
        <RailEvidence label="Öncelik" value={`${card.action.priorityScore}/100`} helper={card.action.urgencyLabel} />
        <RailEvidence label="Efor" value={card.action.effortLabel} helper={card.action.impactLabel} />
        <RailEvidence label="Ürün" value={String(card.affectedProducts.length)} helper={card.action.timeHorizonLabel} />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-950">Kısa iş</h3>
        <div className="mt-3 grid gap-3">
          {card.action.todayChecklist.slice(0, 2).map((item) => (
            <div key={`${card.id}-${item.label}`} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Link
          href={card.href}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
        >
          Detayı aç
          <ArrowRight size={15} weight="bold" />
        </Link>
        {product ? (
          <Link
            href={product.href}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 active:translate-y-px"
          >
            Ürünü incele
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function ActionEvidenceMetric({ item }: { item: SellerActionListItem["evidence"][number] }) {
  const className =
    item.tone === "warning"
      ? "bg-orange-50 text-orange-700"
      : item.tone === "good"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-lg p-3 ${className}`}>
      <p className="text-xs opacity-75">{item.label}</p>
      <p className="mt-1 font-mono text-sm font-semibold">{item.value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 opacity-75">{item.helper}</p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function RailEvidence({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-4 py-4">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div>
        <p className="font-mono text-lg font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
      </div>
    </div>
  );
}

function EmptyActionsState({ onReset, searchQuery }: { onReset: () => void; searchQuery: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <ListChecks className="mx-auto text-slate-300" size={34} weight="duotone" />
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Bu görünümde aksiyon yok.</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
        {searchQuery
          ? "Arama ve kategori filtresi birlikte daraldı. Listeyi sıfırlayıp tüm aksiyonlara dönebilirsin."
          : "Bu kategoriye giren aksiyon bulunamadı. Yeni sinyal oluştuğunda liste otomatik güncellenir."}
      </p>
      <button
        type="button"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
        onClick={onReset}
      >
        Filtreyi sıfırla
      </button>
    </div>
  );
}

function renderFocusIcon(focus: SellerActionsFocusKey, isActive: boolean) {
  const Icon = focusIconMap[focus];

  return <Icon size={17} weight={isActive ? "fill" : "duotone"} />;
}

function sortSellerActionCards(
  first: SellerActionListItem,
  second: SellerActionListItem,
  sortKey: SortKey,
): number {
  switch (sortKey) {
    case "category":
      return first.action.categoryLabel.localeCompare(second.action.categoryLabel, "tr-TR");
    case "products-desc":
      return second.affectedProducts.length - first.affectedProducts.length;
    case "urgency":
      return getUrgencyRank(second.action.urgency) - getUrgencyRank(first.action.urgency);
    case "priority-desc":
    default:
      return second.action.priorityScore - first.action.priorityScore;
  }
}

function getUrgencyRank(urgency: SellerActionListItem["action"]["urgency"]): number {
  switch (urgency) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}
