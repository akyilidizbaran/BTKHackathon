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
  SellerProductApiRow,
  SellerProductRiskSignal,
  SellerProductsApiData,
  SellerProductsFocusKey,
} from "@/lib/api/seller";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type SortKey = "health-asc" | "revenue-desc" | "stock-asc" | "reviews-desc";

interface SellerProductsWorkspaceProps {
  data: SellerProductsApiData;
  initialFocus: SellerProductsFocusKey;
}

const sortOptions: Array<{ id: SortKey; label: string }> = [
  { id: "health-asc", label: "Risk önce" },
  { id: "stock-asc", label: "Stok azalan" },
  { id: "revenue-desc", label: "Gelir yüksek" },
  { id: "reviews-desc", label: "Yorum yoğun" },
];

const focusIconMap: Record<SellerProductsFocusKey, typeof Package> = {
  all: Storefront,
  "at-risk": WarningCircle,
  "negative-reviews": ChatCircleText,
  "return-risk": ListChecks,
  "slow-movers": TrendDown,
  "stock-risk": Package,
};

export function SellerProductsWorkspace({ data, initialFocus }: SellerProductsWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeFocus, setActiveFocus] = useState<SellerProductsFocusKey>(initialFocus);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("health-asc");
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
    data.spotlightProduct?.id ?? data.products[0]?.id,
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("tr-TR");

    return data.products
      .filter((product) => activeFocus === "all" || product.focusTags.includes(activeFocus))
      .filter((product) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          product.name,
          product.brand,
          product.sku,
          product.categoryLabel,
          product.subcategory,
          ...product.riskSignals.map((signal) => signal.label),
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);
      })
      .sort((first, second) => sortSellerProducts(first, second, sortKey));
  }, [activeFocus, data.products, searchQuery, sortKey]);

  const selectedProduct = useMemo(() => {
    return (
      visibleProducts.find((product) => product.id === selectedProductId) ??
      visibleProducts[0] ??
      data.spotlightProduct ??
      data.products[0]
    );
  }, [data.products, data.spotlightProduct, selectedProductId, visibleProducts]);

  const activeSegment = data.segments.find((segment) => segment.id === activeFocus) ?? data.segments[0];
  const maxCategoryCount = Math.max(...data.categoryBreakdown.map((category) => category.productCount), 1);
  const activeProductsHref = activeFocus === "all" ? "/seller/products" : `/seller/products?focus=${activeFocus}`;
  const railChips = data.segments
    .map((segment) => `${segment.label} ${segment.productCount}`)
    .concat(["Fotoğraflı ürün yönetimi", "Sağlık skoru", "Stok eşiği", "Yorum sinyali"]);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-seller-products-reveal]",
        {
          opacity: 0,
          y: 18,
        },
        {
          clearProps: "opacity,transform",
          duration: 0.56,
          ease: "power3.out",
          opacity: 1,
          stagger: 0.045,
          y: 0,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-product-media]").forEach((element) => {
        gsap.fromTo(
          element,
          {
            opacity: 0.78,
            scale: 0.94,
          },
          {
            ease: "none",
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              end: "bottom 35%",
              scrub: true,
              start: "top 90%",
              trigger: element,
            },
          },
        );
      });
    },
    { dependencies: [activeFocus, searchQuery, sortKey, visibleProducts.length], scope: rootRef },
  );

  function handleFocusChange(focus: SellerProductsFocusKey) {
    setActiveFocus(focus);

    const nextUrl = focus === "all" ? "/seller/products" : `/seller/products?focus=${focus}`;
    window.history.pushState(null, "", nextUrl);
  }

  return (
    <div ref={rootRef} className="overflow-x-hidden">
      <section className="grid grid-flow-dense items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div
            data-seller-products-reveal
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <h2 className="max-w-5xl text-3xl font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 md:text-[2.25rem]">
                  Ürünleri tek bakışta yönet.
                </h2>
                <p className="mt-2 max-w-[62ch] text-sm leading-5 text-slate-600">
                  Fotoğraf, stok, satış, fiyat, yorum ve risk sinyali aynı satırda okunur. Overview kartlarından gelen
                  odaklar bu ekranda gerçek filtreye dönüşür.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
                    onClick={() => handleFocusChange("at-risk")}
                  >
                    <WarningCircle size={17} weight="duotone" />
                    Risklileri sırala
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
                    onClick={() => handleFocusChange("stock-risk")}
                  >
                    <FunnelSimple size={17} weight="duotone" />
                    Stok filtresi
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                    <Package size={21} weight="duotone" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{data.seller.displayName}</p>
                    <p className="text-xs text-slate-500">Aktif görünüm: {activeSegment?.label ?? "Tümü"}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-orange-200/80">
                  <HeroMetric label="Ürün" value={String(data.summary.productCount)} />
                  <HeroMetric label="Sağlık" value={`${data.summary.averageHealthScore}/100`} />
                  <HeroMetric label="Riskli" value={String(data.summary.riskyProductCount)} />
                  <HeroMetric label="Görünen" value={String(visibleProducts.length)} />
                </div>
              </div>
            </div>
          </div>

          <section
            data-seller-products-reveal
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-4"
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="flex flex-wrap gap-2">
                {data.segments.map((segment) => {
                  const Icon = focusIconMap[segment.id];
                  const isActive = activeFocus === segment.id;

                  return (
                    <button
                      key={segment.id}
                      type="button"
                      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition active:translate-y-px ${
                        isActive
                          ? "min-w-[128px] bg-slate-950 text-[#fff] shadow-[0_14px_28px_-22px_rgba(15,23,42,0.9)]"
                          : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:text-orange-700 hover:ring-orange-200"
                      }`}
                      onClick={() => handleFocusChange(segment.id)}
                    >
                      <Icon size={17} weight={isActive ? "fill" : "duotone"} />
                      <span>{segment.label}</span>
                      <span className={isActive ? "font-mono text-orange-200" : "font-mono text-slate-400"}>
                        {segment.productCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px] lg:grid-cols-1">
                <label className="relative block" htmlFor="seller-products-search">
                  <span className="sr-only">Ürün ara</span>
                  <MagnifyingGlass
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                    weight="bold"
                  />
                  <input
                    id="seller-products-search"
                    aria-label="Ürün ara"
                    className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="Ürün, SKU veya risk ara"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      aria-label="Aramayı temizle"
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={15} weight="bold" />
                    </button>
                  ) : null}
                </label>

                <label className="relative block" htmlFor="seller-products-sort">
                  <span className="sr-only">Sıralama</span>
                  <SlidersHorizontal
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                    weight="duotone"
                  />
                  <select
                    id="seller-products-sort"
                    aria-label="Ürün sıralaması"
                    className="h-10 w-full appearance-none rounded-full border border-slate-200 bg-slate-50 px-11 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
            </div>
          </section>
        </div>

        <aside
          data-seller-products-reveal
          className="self-start rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Canlı ürün bandı</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Filtre değişince ilk aday burada kısaca görünür.
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100">
              <ChartLineUp size={21} weight="duotone" />
            </span>
          </div>

          {selectedProduct ? (
            <Link
              href={selectedProduct.href}
              aria-label={`${selectedProduct.name} ürün detayını aç`}
              className="mt-4 grid min-h-16 grid-cols-[70px_1fr] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 transition hover:border-orange-200 hover:bg-orange-50 active:translate-y-px"
            >
              <span className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <span
                  data-product-media
                  aria-label={selectedProduct.image.alt}
                  className="block aspect-[4/3] bg-[length:600%_800%] bg-no-repeat transition duration-700 hover:scale-105"
                  role="img"
                  style={{
                    backgroundImage: `url(${selectedProduct.image.src})`,
                    backgroundPosition: selectedProduct.image.position,
                  }}
                />
              </span>
              <span className="min-w-0 self-center">
                <span className="block truncate text-sm font-semibold text-slate-950">{selectedProduct.name}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {selectedProduct.categoryLabel} · {selectedProduct.stockStatusLabel}
                </span>
              </span>
            </Link>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {railChips.slice(0, 4).map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-4 grid grid-flow-dense gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div data-seller-products-reveal className="min-w-0">
          <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Fotoğraflı ürün listesi</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {visibleProducts.length} ürün görünüyor. Fiyat, satış, stok, yorum ve risk sinyalleri aynı akışta.
              </p>
            </div>
            <Link
              href={activeProductsHref}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              Odağı aç
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid grid-flow-dense gap-3">
              {visibleProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  isSelected={selectedProduct?.id === product.id}
                  product={product}
                  onSelect={() => setSelectedProductId(product.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyProductsState
              searchQuery={searchQuery}
              onReset={() => {
                setSearchQuery("");
                handleFocusChange("all");
              }}
            />
          )}
        </div>

        <aside data-seller-products-reveal className="space-y-5">
          {selectedProduct ? <SelectedProductRail product={selectedProduct} /> : null}

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Kategori yoğunluğu</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Riskli ürünlerin hangi ailede toplandığını gösterir.
            </p>
            <div className="mt-5 space-y-4">
              {data.categoryBreakdown.slice(0, 7).map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-800">{category.label}</span>
                    <span className="font-mono text-slate-950">{category.riskCount}/{category.productCount}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${Math.max(10, (category.productCount / maxCategoryCount) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {category.averageHealthScore}/100 sağlık · {formatTry(category.revenue30d)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ProductRow({
  isSelected,
  onSelect,
  product,
}: {
  isSelected: boolean;
  onSelect: () => void;
  product: SellerProductApiRow;
}) {
  const visibleSignals = product.riskSignals.slice(0, 3);

  return (
    <article
      data-seller-products-reveal
      className={`group rounded-lg border bg-white p-3 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_24px_58px_-44px_rgba(15,23,42,0.68)] ${
        isSelected ? "border-orange-300 ring-4 ring-orange-100" : "border-slate-200"
      }`}
    >
      <div className="grid gap-5 lg:grid-cols-[104px_minmax(0,1fr)_120px_120px_124px_132px] lg:items-center">
        <button
          type="button"
          aria-label={`${product.name} ürününü seç`}
          className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left"
          onClick={onSelect}
        >
          <span
            data-product-media
            aria-label={product.image.alt}
            className="block aspect-[4/3] bg-[length:600%_800%] bg-no-repeat transition duration-700 ease-out group-hover:scale-105"
            role="img"
            style={{
              backgroundImage: `url(${product.image.src})`,
              backgroundPosition: product.image.position,
            }}
          />
        </button>

        <div className="min-w-0">
          <button type="button" className="block min-w-0 text-left" onClick={onSelect}>
            <p className="text-xs font-semibold text-orange-600">{product.brand}</p>
            <h3 className="mt-1 max-w-[20ch] truncate text-base font-semibold tracking-[-0.02em] text-slate-950 xl:max-w-[22ch]">
              {product.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{product.categoryLabel} · {product.sku}</p>
          </button>
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleSignals.length > 0 ? (
              visibleSignals.map((signal) => <RiskSignalChip key={signal.id} signal={signal} />)
            ) : (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Sağlıklı
              </span>
            )}
          </div>
        </div>

        <ProductMetric label="Fiyat" value={formatTryFull(product.price)} />
        <ProductMetric label="Stok" value={`${product.availableStock} adet`} helper={product.stockStatusLabel} />
        <ProductMetric label="Satış" value={`${product.orders30d}`} helper={formatTry(product.revenue30d)} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <ProductMetric label="Yorum" value={product.ratingAverage.toFixed(1)} helper={`${product.reviewCount} yorum`} />
          <div className="flex gap-2 lg:flex-col">
            <button
              type="button"
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
              onClick={onSelect}
            >
              Seç
            </button>
            <Link
              href={product.href}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-3 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
            >
              Detay
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function SelectedProductRail({ product }: { product: SellerProductApiRow }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div
          data-product-media
          aria-label={product.image.alt}
          className="aspect-[4/3] bg-[length:600%_800%] bg-no-repeat"
          role="img"
          style={{
            backgroundImage: `url(${product.image.src})`,
            backgroundPosition: product.image.position,
          }}
        />
      </div>
      <p className="mt-4 text-xs font-semibold text-orange-600">{product.brand}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{product.name}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {product.healthLabel}. Agent bu ürünü açtığında stok, satış, yorum ve iade sinyalleriyle ilerler.
      </p>

      <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
        <RailEvidence label="Sağlık" value={`${product.healthScore}/100`} helper={product.healthLabel} />
        <RailEvidence label="Stok" value={`${product.availableStock} adet`} helper={`${product.reorderPoint} adet eşik`} />
        <RailEvidence label="Satış" value={`${product.orders30d} sipariş`} helper={formatTry(product.revenue30d)} />
        <RailEvidence label="Yorum" value={product.ratingAverage.toFixed(1)} helper={`${product.reviewCount} yorum`} />
      </div>

      <div className="mt-5 space-y-2">
        <Link
          href={product.href}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
        >
          Ürün detayını aç
          <ArrowRight size={15} weight="bold" />
        </Link>
        {product.linkedAction ? (
          <Link
            href={product.linkedAction.href}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 active:translate-y-px"
          >
            Aksiyonu aç · {product.linkedAction.priorityScore}/100
          </Link>
        ) : (
          <Link
            href="/seller/agent"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
          >
            Agent ile analiz et
          </Link>
        )}
      </div>
    </div>
  );
}

function RiskSignalChip({ signal }: { signal: SellerProductRiskSignal }) {
  const className =
    signal.tone === "danger"
      ? "bg-red-50 text-red-700 ring-red-200"
      : signal.tone === "warning"
        ? "bg-orange-50 text-orange-700 ring-orange-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>
      {signal.label}
    </span>
  );
}

function ProductMetric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
      {helper ? <p className="mt-1 truncate text-xs text-slate-500">{helper}</p> : null}
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

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/80 p-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyProductsState({ onReset, searchQuery }: { onReset: () => void; searchQuery: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <Package className="mx-auto text-slate-300" size={34} weight="duotone" />
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Bu görünümde ürün yok.</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
        {searchQuery
          ? "Arama ve risk filtresi birlikte çok daraldı. Listeyi sıfırlayıp tüm ürünlere dönebilirsin."
          : "Bu odağa giren ürün bulunamadı. Yeni sinyal geldiğinde bu liste otomatik güncellenir."}
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

function sortSellerProducts(first: SellerProductApiRow, second: SellerProductApiRow, sortKey: SortKey): number {
  switch (sortKey) {
    case "revenue-desc":
      return second.revenue30d - first.revenue30d;
    case "reviews-desc":
      return second.reviewCount - first.reviewCount;
    case "stock-asc":
      return first.availableStock - second.availableStock;
    case "health-asc":
    default:
      return first.healthScore - second.healthScore;
  }
}

function formatTry(value: number): string {
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absoluteValue >= 1_000_000) {
    return `${sign}₺${formatCompactMetric(absoluteValue / 1_000_000)} Mn`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}₺${formatCompactMetric(absoluteValue / 1_000)} B`;
  }

  return `${sign}₺${formatCompactMetric(absoluteValue)}`;
}

function formatTryFull(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatCompactMetric(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value);
}
