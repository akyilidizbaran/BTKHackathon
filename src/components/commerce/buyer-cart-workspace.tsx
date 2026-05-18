"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  ShoppingBagOpen,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  addBuyerCartItem,
  buyerCartUpdatedEvent,
  clearBuyerCartItems,
  readBuyerCartItems,
  removeBuyerCartItem,
  setBuyerCartItemQuantity,
  type BuyerCartItem,
} from "@/lib/cart/buyer-cart";
import type { BuyerCatalogProductCard } from "@/lib/api/buyer-catalog";

gsap.registerPlugin(useGSAP);

export function BuyerCartWorkspace({ products }: { products: BuyerCatalogProductCard[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<BuyerCartItem[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "ready">("idle");

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const lines = useMemo(
    () =>
      items
        .map((item) => {
          const product = productById.get(item.productId);
          return product ? { item, product } : undefined;
        })
        .filter((line): line is { item: BuyerCartItem; product: BuyerCatalogProductCard } => Boolean(line)),
    [items, productById],
  );
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.item.quantity, 0);
  const compareTotal = lines.reduce(
    (sum, line) => sum + (line.product.compareAtPrice ?? line.product.price) * line.item.quantity,
    0,
  );
  const discount = Math.max(0, compareTotal - subtotal);
  const shipping = subtotal === 0 || subtotal >= 350 ? 0 : 49;
  const total = subtotal + shipping;
  const itemCount = lines.reduce((sum, line) => sum + line.item.quantity, 0);
  const suggestedProducts = products.filter((product) => !items.some((item) => item.productId === product.id)).slice(0, 3);

  useEffect(() => {
    function syncCart() {
      setItems(readBuyerCartItems());
      setCheckoutStatus("idle");
    }

    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener(buyerCartUpdatedEvent, syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(buyerCartUpdatedEvent, syncCart);
    };
  }, []);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray("[data-cart-row]");

      if (rows.length === 0) {
        return;
      }

      gsap.from(rows, {
        y: 14,
        opacity: 0,
        duration: 0.45,
        stagger: 0.045,
        ease: "power3.out",
      });
    },
    { scope: rootRef, dependencies: [lines.length] },
  );

  function changeQuantity(productId: string, delta: number) {
    const currentItem = readBuyerCartItems().find((item) => item.productId === productId);
    const currentQuantity = currentItem?.quantity ?? 0;

    setItems(setBuyerCartItemQuantity(productId, currentQuantity + delta));
  }

  function removeItem(productId: string) {
    setItems(removeBuyerCartItem(productId));
  }

  function addSuggestedProduct(productId: string) {
    setItems(addBuyerCartItem(productId, 1));
  }

  function clearCart() {
    setItems(clearBuyerCartItems());
  }

  return (
    <div ref={rootRef} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">Sepetim</h2>
            <p className="mt-2 text-sm text-slate-500">
              {itemCount > 0 ? `${itemCount} ürün bu tarayıcıdaki sepette korunuyor.` : "Sepetin şu an boş."}
            </p>
          </div>
          {lines.length > 0 ? (
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
              onClick={clearCart}
            >
              Sepeti Temizle
            </button>
          ) : null}
        </div>

        {lines.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {lines.map(({ item, product }) => (
              <article key={product.id} data-cart-row className="grid gap-4 py-5 md:grid-cols-[116px_1fr_auto]">
                <Link
                  href={product.href}
                  aria-label={`${product.name} ürün detayını aç`}
                  className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div
                    aria-label={product.image.alt}
                    className="aspect-square bg-[length:500%_400%] bg-no-repeat transition duration-700 hover:scale-105"
                    role="img"
                    style={{
                      backgroundImage: `url(${product.image.src})`,
                      backgroundPosition: product.image.position,
                    }}
                  />
                </Link>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange-600">{product.brand}</p>
                  <Link href={product.href} className="mt-1 block text-base font-semibold leading-6 text-slate-950 hover:text-orange-700">
                    {product.name}
                  </Link>
                  <p className="mt-2 text-sm text-slate-500">
                    {product.categoryLabel} · {product.subcategory}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{product.deliveryLabel}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{product.campaignLabel}</span>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 md:items-end">
                  <div className="text-left md:text-right">
                    {product.compareAtPrice ? (
                      <p className="text-xs text-slate-400 line-through">{formatTry(product.compareAtPrice * item.quantity)}</p>
                    ) : null}
                    <p className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                      {formatTry(product.price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white">
                      <button
                        type="button"
                        aria-label={`${product.name} adedini azalt`}
                        className="grid h-10 w-10 place-items-center rounded-l-full text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
                        onClick={() => changeQuantity(product.id, -1)}
                      >
                        <Minus size={15} weight="bold" />
                      </button>
                      <span className="min-w-9 text-center font-mono text-sm font-semibold text-slate-950">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`${product.name} adedini artır`}
                        className="grid h-10 w-10 place-items-center rounded-r-full text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
                        onClick={() => changeQuantity(product.id, 1)}
                      >
                        <Plus size={15} weight="bold" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`${product.name} sepetten çıkar`}
                      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600 active:scale-[0.98]"
                      onClick={() => removeItem(product.id)}
                    >
                      <Trash size={16} weight="duotone" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyCartState />
        )}

        {suggestedProducts.length > 0 ? (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Sepete eklenebilecekler</h2>
              <Link
                href="/buyer/products"
                className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 hover:text-orange-800 active:translate-y-px"
              >
                Tüm ürünler
              </Link>
            </div>
            <div className="mt-4 grid grid-flow-dense gap-3 md:grid-cols-3">
              {suggestedProducts.map((product) => (
                <article key={product.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <Link
                    href={product.href}
                    aria-label={`${product.name} ürün detayını aç`}
                    className="block aspect-[4/3] overflow-hidden bg-white"
                  >
                    <div
                      aria-label={product.image.alt}
                      className="h-full bg-[length:500%_400%] bg-no-repeat transition duration-700 hover:scale-105"
                      role="img"
                      style={{
                        backgroundImage: `url(${product.image.src})`,
                        backgroundPosition: product.image.position,
                      }}
                    />
                  </Link>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-orange-600">{product.brand}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-950">{product.name}</h3>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="font-semibold tracking-[-0.04em] text-slate-950">{formatTry(product.price)}</p>
                      <button
                        type="button"
                        className="rounded-full bg-orange-500 px-3 py-2 text-xs font-semibold text-[#fff] transition hover:bg-orange-600 active:scale-[0.98]"
                        onClick={() => addSuggestedProduct(product.id)}
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Sepet özeti</h2>
          <div className="mt-5 space-y-3 text-sm">
            <SummaryRow label="Ürün adedi" value={String(itemCount)} />
            <SummaryRow label="Ara toplam" value={formatTry(subtotal)} />
            <SummaryRow label="İndirim" value={discount > 0 ? `-${formatTry(discount)}` : formatTry(0)} />
            <SummaryRow label="Kargo" value={shipping === 0 ? "Ücretsiz" : formatTry(shipping)} />
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-slate-500">Toplam</span>
              <span className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">{formatTry(total)}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={lines.length === 0}
            className="mt-5 min-h-12 w-full rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px disabled:bg-slate-200 disabled:text-slate-500"
            onClick={() => setCheckoutStatus("ready")}
          >
            {checkoutStatus === "ready" ? "Sipariş Özeti Hazır" : "Alışverişi Tamamla"}
          </button>
          <Link
            href="/buyer/agent"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
          >
            <Sparkle size={16} weight="duotone" />
            Agent ile sepeti optimize et
          </Link>
          <p aria-live="polite" className="mt-4 min-h-5 text-xs font-semibold text-emerald-700">
            {checkoutStatus === "ready" ? "Ödeme adımı bu demoda kapalı; sepet hazır." : ""}
          </p>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-orange-700">Sepet bu tarayıcıda korunur</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Sayfayı yenilesen bile seçtiğin ürünler bu cihazda kalır.
          </p>
        </div>
      </aside>
    </div>
  );
}

function EmptyCartState() {
  return (
    <div className="mt-6 grid min-h-[360px] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-slate-700 shadow-[0_16px_44px_-34px_rgba(15,23,42,0.75)]">
          <ShoppingBagOpen size={26} weight="duotone" />
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Sepetin şu an boş.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Ürünlerden seçim yapabilir veya Agent’a bütçe ve stil söyleyerek sepeti başlatabilirsin.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/buyer/products"
            className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px"
          >
            Ürünlere git
          </Link>
          <Link
            href="/buyer/agent"
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
          >
            Agent ile sepet kur
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
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
