"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import {
  ArrowRight,
  ChatCircleText,
  ListChecks,
  Package,
  Robot,
  Storefront,
  TrendDown,
  WarningCircle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type {
  SellerOverviewAlertCard,
  SellerOverviewAlertId,
  SellerOverviewApiData,
  SellerProductsApiData,
} from "@/lib/api/seller";
import type { ProductCategory } from "@/types/commerce";

gsap.registerPlugin(useGSAP);

interface SellerOverviewWorkspaceProps {
  overview: SellerOverviewApiData;
  products: SellerProductsApiData;
}

const categoryLabels: Record<ProductCategory, string> = {
  aksesuar: "Aksesuar",
  "elektronik-aksesuar": "Elektronik",
  "erkek-giyim": "Erkek Giyim",
  "ev-ofis": "Ev & Yaşam",
  "hediye-yasam-tarzi": "Aksesuar",
  "kahve-ekipmanlari": "Ev & Yaşam",
  "kadin-giyim": "Kadın Giyim",
  kozmetik: "Kozmetik",
  "kucuk-ev-yasam": "Ev & Yaşam",
  "masa-calisma-alani": "Ev & Yaşam",
  spor: "Spor",
};

const alertIconMap: Record<SellerOverviewAlertId, typeof Package> = {
  negative_reviews: ChatCircleText,
  return_risk: WarningCircle,
  slow_movers: TrendDown,
  stock_risk: Package,
};

export function SellerOverviewWorkspace({ overview, products }: SellerOverviewWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const categoryCounts = useMemo(() => {
    return Array.from(
      products.products.reduce((map, product) => {
        const label = categoryLabels[product.category];
        map.set(label, (map.get(label) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    ).sort((first, second) => second[1] - first[1]);
  }, [products.products]);
  const topProducts = products.products
    .slice()
    .sort((first, second) => first.healthScore - second.healthScore)
    .slice(0, 4);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-seller-overview-reveal]",
        {
          y: 18,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          clearProps: "transform,opacity",
          duration: 0.58,
          ease: "power3.out",
          stagger: 0.055,
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="space-y-5">
      <section className="grid grid-flow-dense items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div
            data-seller-overview-reveal
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
              <div>
                <h2 className="max-w-5xl text-4xl font-semibold leading-[0.96] tracking-[-0.06em] text-slate-950 md:text-5xl">
                  Bugün hangi ürüne müdahale etmeli?
                </h2>
                <p className="mt-4 max-w-[66ch] text-sm leading-6 text-slate-600">
                  Satıcı ana sayfası stok, yorum, iade ve satış sinyallerini tek öncelik akışında toplar. Her kart
                  yapılacak işi ve etkilenen ürünü kısa şekilde gösterir.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/seller/agent"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
                  >
                    <Robot size={17} weight="duotone" />
                    Agent ile sırala
                  </Link>
                  <Link
                    href="/seller/actions"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
                  >
                    Aksiyonlara git
                    <ArrowRight size={15} weight="bold" />
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                    <Storefront size={22} weight="duotone" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{overview.seller.displayName}</p>
                    <p className="text-xs text-slate-500">
                      Yanıt: {overview.seller.supportResponseHours} saat · Puan {overview.seller.rating}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-orange-200/80">
                  <HeroMetric label="Ürün" value={String(overview.stats.analyzedProductCount)} />
                  <HeroMetric label="Sipariş" value={String(overview.stats.totalOrders30d)} />
                  <HeroMetric label="Gelir" value={formatTry(overview.stats.totalRevenue30d)} />
                  <HeroMetric label="Sağlık" value={`${products.summary.averageHealthScore}/100`} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-flow-dense gap-4 md:grid-cols-2">
            {overview.alertCards.map((card) => (
              <AlertCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        <aside
          data-seller-overview-reveal
          className="rounded-lg bg-slate-950 p-5 text-[#fff] shadow-[0_22px_56px_-36px_rgba(15,23,42,0.95)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#fff]">Öncelik sırası</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Agent’ın ilk açacağı dört operasyon işi.
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-200">
              <ListChecks size={21} weight="duotone" />
            </span>
          </div>
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {overview.priorityQueue.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group -mx-3 grid min-h-20 gap-3 rounded-lg px-3 py-4 transition hover:translate-x-1 hover:bg-white/5 active:translate-y-px"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-5 text-[#fff]">{item.title}</p>
                  <span className="font-mono text-xs text-orange-200">{item.priorityScore}/100</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span className="truncate">{item.helper}</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-300">{item.ownerLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid grid-flow-dense gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div
          data-seller-overview-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Ürün dağılımı</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Kategori yoğunluğu risk kartlarının hangi ürün ailesine döndüğünü gösterir.
              </p>
            </div>
            <Link
              href="/seller/products"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              Ürünleri aç
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {categoryCounts.map(([label, count]) => (
              <div key={label} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0 md:first:border-t md:first:pt-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-800">{label}</span>
                  <span className="font-mono text-slate-950">{count}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${Math.max(12, (count / products.summary.productCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside
          data-seller-overview-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
        >
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Yakından bakılacak ürünler</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sağlık skoru en düşük ürünler seller action akışının ilk adaylarıdır.
          </p>
          <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
            {topProducts.map((product) => (
              <Link key={product.id} href={product.href} className="group grid grid-cols-[68px_1fr] gap-4 py-4">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <div
                    aria-label={product.image.alt}
                    className="aspect-square bg-[length:500%_400%] bg-no-repeat transition duration-700 group-hover:scale-105"
                    role="img"
                    style={{
                      backgroundImage: `url(${product.image.src})`,
                      backgroundPosition: product.image.position,
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.stockStatusLabel}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-950">{product.healthScore}/100</span>
                    <span className="text-xs font-semibold text-orange-700">Detay</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function AlertCard({ card }: { card: SellerOverviewAlertCard }) {
  const Icon = alertIconMap[card.id];
  const toneClass =
    card.tone === "danger"
      ? "border-red-200 bg-red-50/70 text-red-700"
      : card.tone === "warning"
        ? "border-orange-200 bg-orange-50/70 text-orange-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <Link
      data-seller-overview-reveal
      href={card.href}
      className="group flex min-h-[360px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)] transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_28px_60px_-46px_rgba(15,23,42,0.7)] active:translate-y-px"
    >
      <span className="flex items-start justify-between gap-4">
        <span className={`grid h-11 w-11 place-items-center rounded-lg border ${toneClass}`}>
          <Icon size={21} weight="duotone" />
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {card.ownerLabel}
        </span>
      </span>

      <span className="mt-5 block">
        <span className="block font-mono text-5xl font-semibold tracking-[-0.08em] text-slate-950">{card.value}</span>
        <span className="mt-3 block text-lg font-semibold tracking-[-0.03em] text-slate-950">{card.title}</span>
        <span className="mt-2 block text-sm leading-6 text-slate-600">{card.summary}</span>
      </span>

      {card.primaryProduct ? (
        <span className="mt-5 grid grid-cols-[54px_1fr] gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <span className="overflow-hidden rounded-lg bg-white">
            <span
              aria-label={card.primaryProduct.image.alt}
              className="block aspect-square bg-[length:500%_400%] bg-no-repeat transition duration-700 group-hover:scale-105"
              role="img"
              style={{
                backgroundImage: `url(${card.primaryProduct.image.src})`,
                backgroundPosition: card.primaryProduct.image.position,
              }}
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950">{card.primaryProduct.name}</span>
            <span className="mt-1 block text-xs text-slate-500">{card.primaryProduct.healthScore}/100 sağlık</span>
          </span>
        </span>
      ) : null}

      <span className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-200">
        {card.evidence.map((item) => (
          <span key={`${card.id}-${item.label}`} className="bg-slate-50 p-3">
            <span className="block text-xs text-slate-500">{item.label}</span>
            <span className="mt-1 block font-mono text-sm font-semibold text-slate-950">{item.value}</span>
          </span>
        ))}
      </span>

      <span className="mt-5 inline-flex min-h-10 items-center justify-between gap-3 rounded-full bg-slate-950 px-4 text-sm font-semibold text-[#fff] transition group-hover:bg-orange-500">
        Detayı aç
        <ArrowRight size={15} weight="bold" />
      </span>
    </Link>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/80 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency",
  }).format(value);
}
