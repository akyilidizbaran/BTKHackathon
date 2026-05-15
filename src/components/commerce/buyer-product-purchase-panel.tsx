"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Minus,
  Plus,
  ShoppingCartSimple,
} from "@phosphor-icons/react";
import { addBuyerCartItem } from "@/lib/cart/buyer-cart";
import type { BuyerCatalogProductCard } from "@/lib/api/buyer-catalog";

export function BuyerProductPurchasePanel({
  availableStock,
  product,
}: {
  availableStock: number;
  product: BuyerCatalogProductCard;
}) {
  const router = useRouter();
  const timerRef = useRef<number | undefined>(undefined);
  const quantityRef = useRef(1);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "added">("idle");

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function changeQuantity(delta: number) {
    const nextQuantity = Math.min(Math.max(quantityRef.current + delta, 1), Math.max(1, Math.min(availableStock, 99)));
    quantityRef.current = nextQuantity;
    setQuantity(nextQuantity);
  }

  function addToCart() {
    addBuyerCartItem(product.id, quantityRef.current);
    setStatus("added");
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setStatus("idle"), 1400);
  }

  function buyNow() {
    addBuyerCartItem(product.id, quantityRef.current);
    router.push("/buyer/cart");
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <p className="text-4xl font-semibold tracking-[-0.06em] text-orange-600">{formatTry(product.price)}</p>
        {product.compareAtPrice ? (
          <p className="pb-1 text-sm text-slate-400 line-through">{formatTry(product.compareAtPrice)}</p>
        ) : null}
        {product.discountPercent ? (
          <span className="mb-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
            %{product.discountPercent} indirim
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white">
          <button
            type="button"
            aria-label="Adedi azalt"
            className="grid h-11 w-11 place-items-center rounded-l-full text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            onClick={() => changeQuantity(-1)}
          >
            <Minus size={16} weight="bold" />
          </button>
          <span className="min-w-10 text-center font-mono text-sm font-semibold text-slate-950">{quantity}</span>
          <button
            type="button"
            aria-label="Adedi artır"
            className="grid h-11 w-11 place-items-center rounded-r-full text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            onClick={() => changeQuantity(1)}
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
        <p className="text-xs font-medium text-slate-500">{availableStock} adet stokta</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_52px]">
        <button
          type="button"
          className="min-h-12 rounded-full border border-orange-500 bg-white px-5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 active:translate-y-px"
          onClick={buyNow}
        >
          Şimdi Al
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px"
          onClick={addToCart}
        >
          <ShoppingCartSimple size={18} weight="bold" />
          {status === "added" ? "Sepete Eklendi" : "Sepete Ekle"}
        </button>
        <button
          type="button"
          aria-label="Favorilere ekle"
          className="grid min-h-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:text-orange-700 active:scale-[0.98]"
        >
          <Heart size={20} weight="duotone" />
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-5 text-xs font-semibold text-emerald-700">
        {status === "added" ? "Ürün bu tarayıcıdaki sepetine eklendi." : ""}
      </p>
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
