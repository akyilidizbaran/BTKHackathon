"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  ShoppingCartSimple,
  Star,
  Truck,
} from "@phosphor-icons/react";
import { addBuyerCartItem } from "@/lib/cart/buyer-cart";
import type { BuyerCatalogProductCard } from "@/lib/api/buyer-catalog";

export function BuyerCatalogGrid({ products }: { products: BuyerCatalogProductCard[] }) {
  const timerRef = useRef<Record<string, number>>({});
  const [addedProductId, setAddedProductId] = useState<string | undefined>();

  useEffect(() => {
    const timers = timerRef.current;

    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function handleAddToCart(productId: string) {
    addBuyerCartItem(productId, 1);
    setAddedProductId(productId);

    if (timerRef.current[productId]) {
      window.clearTimeout(timerRef.current[productId]);
    }

    timerRef.current[productId] = window.setTimeout(() => {
      setAddedProductId((currentProductId) => (currentProductId === productId ? undefined : currentProductId));
      delete timerRef.current[productId];
    }, 1400);
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Bu kategoride ürün yok.</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          Kategori genişledikçe katalog burada otomatik dolacak.
        </p>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:thin]">
        {products.map((product) => (
          <article
            key={product.id}
            className="group flex min-h-[430px] w-[min(78vw,300px)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_22px_58px_-42px_rgba(15,23,42,0.7)]"
          >
            <div className="relative overflow-hidden bg-slate-50">
              <Link
                href={product.href}
                aria-label={`${product.name} ürün detayını aç`}
                className="block aspect-[4/3] overflow-hidden"
              >
                <div
                  className="h-full w-full bg-[length:600%_800%] bg-no-repeat transition duration-700 ease-out group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${product.image.src})`,
                    backgroundPosition: product.image.position,
                  }}
                />
              </Link>
              <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(product.badgeTone)}`}>
                {product.campaignLabel}
              </span>
              <button
                type="button"
                aria-label={`${product.name} favorilere ekle`}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-700 active:scale-[0.98]"
              >
                <Heart size={18} weight="duotone" />
              </button>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <Link href={product.href} className="block">
                <p className="text-xs font-semibold text-orange-600">{product.brand}</p>
                <h3 className="mt-2 line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-slate-950">
                  {product.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  {product.categoryLabel} · {product.subcategory}
                </p>
              </Link>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <Star size={14} weight="fill" className="text-amber-500" />
                  {product.ratingAverage.toFixed(1)}
                </span>
                <span>{product.reviewCount.toLocaleString("tr-TR")} yorum</span>
              </div>

              <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Truck size={14} weight="duotone" />
                {product.deliveryLabel}
              </div>

              <div className="mt-auto pt-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    {product.compareAtPrice ? (
                      <p className="text-xs text-slate-400 line-through">{formatTry(product.compareAtPrice)}</p>
                    ) : null}
                    <p className="text-xl font-semibold text-slate-950">{formatTry(product.price)}</p>
                  </div>
                  <p className="text-xs font-medium text-slate-500">{product.cartAdds30d.toLocaleString("tr-TR")} sepette</p>
                </div>
                <button
                  type="button"
                  aria-label={`${product.name} sepete ekle`}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-4 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:scale-[0.98]"
                  onClick={() => handleAddToCart(product.id)}
                >
                  <ShoppingCartSimple size={18} weight="bold" />
                  {addedProductId === product.id ? "Sepete Eklendi" : "Sepete Ekle"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function getBadgeClass(tone: BuyerCatalogProductCard["badgeTone"]): string {
  const classes: Record<BuyerCatalogProductCard["badgeTone"], string> = {
    calm: "bg-slate-950 text-[#fff]",
    deal: "bg-orange-500 text-[#fff]",
    delivery: "bg-emerald-600 text-[#fff]",
    popular: "bg-amber-400 text-slate-950",
  };

  return classes[tone];
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
