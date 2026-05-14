"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  ArrowRight,
  Bell,
  House,
  ListChecks,
  MagnifyingGlass,
  Package,
  Storefront,
  ShoppingBagOpen,
  ShoppingCart,
  UserCircle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type WorkspaceRole = "seller" | "buyer";

interface WorkspaceShellProps {
  role: WorkspaceRole;
  children: React.ReactNode;
}

const roleConfig = {
  seller: {
    label: "Satıcı",
    eyebrow: "Satıcı merkezi",
    href: "/seller",
    alternateHref: "/buyer",
    alternateLabel: "Mağazaya geç",
    searchPlaceholder: "Ürün, sipariş veya aksiyon ara",
    nav: [
      { href: "/seller", label: "Genel Bakış", icon: House },
      { href: "/seller/actions", label: "Aksiyonlar", icon: ListChecks },
      { href: "/seller/products", label: "Ürünler", icon: Package },
    ],
  },
  buyer: {
    label: "Alıcı",
    eyebrow: "Marketplace",
    href: "/buyer",
    alternateHref: "/seller",
    alternateLabel: "Satıcı merkezine geç",
    searchPlaceholder: "Ürün, kategori veya ihtiyacını ara",
    nav: [
      { href: "/buyer", label: "Ana sayfa", icon: Storefront },
      { href: "/buyer/products", label: "Ürünler", icon: ShoppingBagOpen },
      { href: "/buyer/cart", label: "Sepet", icon: ShoppingCart },
    ],
  },
} satisfies Record<WorkspaceRole, {
  label: string;
  eyebrow: string;
  href: string;
  alternateHref: string;
  alternateLabel: string;
  searchPlaceholder: string;
  nav: Array<{ href: string; label: string; icon: typeof House }>;
}>;

export function WorkspaceShell({ role, children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const config = roleConfig[role];
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-shell-reveal]", {
        y: 16,
        opacity: 0,
        duration: 0.65,
        stagger: 0.06,
        ease: "power3.out",
      });
    },
    { scope: rootRef, dependencies: [pathname] },
  );

  return (
    <main
      ref={rootRef}
      className="relative min-h-[100dvh] overflow-x-hidden bg-[#f6f7fb] text-slate-950"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(249,115,22,0.08),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(5,150,105,0.07),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 commerce-noise" />

      <div className="relative border-b border-slate-200/80 bg-white/95 shadow-[0_12px_36px_-32px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 lg:px-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3 rounded-2xl py-1 pr-2 transition hover:bg-slate-50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.8)]">
                CP
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold tracking-tight text-slate-950">CommercePilot</span>
                <span className="block text-xs text-slate-500">{config.eyebrow}</span>
              </span>
            </Link>

            <form className="relative min-w-0 flex-1" role="search">
              <MagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={19}
                weight="bold"
              />
              <input
                aria-label="CommercePilot arama"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                placeholder={config.searchPlaceholder}
              />
              <button
                type="button"
                className="absolute right-1.5 top-1.5 hidden h-9 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 active:translate-y-px md:inline-flex md:items-center"
              >
                Ara
              </button>
            </form>

            <Link
              href={config.alternateHref}
              className="hidden min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px lg:inline-flex"
            >
              <span>{config.alternateLabel}</span>
              <ArrowRight size={16} weight="bold" />
            </Link>

            <button
              type="button"
              aria-label="Bildirimler"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              <Bell size={20} weight="duotone" />
            </button>
            <button
              type="button"
              aria-label="Profil"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              <UserCircle size={22} weight="duotone" />
            </button>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={`${config.label} navigasyonu`}>
            {config.nav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== config.href && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition active:translate-y-px ${
                    isActive
                      ? "bg-slate-950 text-white shadow-[0_14px_28px_-22px_rgba(15,23,42,0.9)]"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-orange-700 hover:ring-orange-200"
                  }`}
                >
                  <Icon size={18} weight={isActive ? "fill" : "duotone"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              href={config.alternateHref}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-orange-700 hover:ring-orange-200 active:translate-y-px lg:hidden"
            >
              {config.alternateLabel}
              <ArrowRight size={15} weight="bold" />
            </Link>
          </nav>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[240px_1fr] lg:px-5">
        <aside
          data-shell-reveal
          className="hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_54px_-46px_rgba(15,23,42,0.75)] lg:sticky lg:top-5 lg:block lg:h-[calc(100dvh-2.5rem)]"
        >
          <div className="flex h-full flex-col">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {role === "buyer" ? "Alışveriş" : "Satıcı araçları"}
            </p>

            <div className="mt-4 space-y-2">
              {config.nav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== config.href && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition active:translate-y-px ${
                      isActive
                        ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <Icon size={20} weight={isActive ? "fill" : "duotone"} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-5">
              <Link
                href={config.alternateHref}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 active:translate-y-px"
              >
                <span>{config.alternateLabel}</span>
                <ArrowRight size={17} weight="bold" />
              </Link>
            </div>

            <div className="mt-auto hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-6 text-emerald-800 lg:block">
              <p>Agent pet sonraki milestone’da bu shell üzerinde yaşayacak.</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 pb-10">
          <header
            data-shell-reveal
            className="mb-5 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.75)] md:flex-row md:items-center"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">{config.eyebrow}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950 md:text-3xl">
                {role === "buyer" ? "CommercePilot alışveriş" : "CommercePilot satıcı merkezi"}
              </h1>
            </div>
            <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
              <Link
                href="/seller"
                className={`rounded-full px-4 py-2 text-center transition active:translate-y-px ${
                  role === "seller" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-orange-700"
                }`}
              >
                Satıcı
              </Link>
              <Link
                href="/buyer"
                className={`rounded-full px-4 py-2 text-center transition active:translate-y-px ${
                  role === "buyer" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-orange-700"
                }`}
              >
                Alıcı
              </Link>
            </div>
          </header>

          <div data-shell-reveal className="commerce-legacy-light">{children}</div>
        </section>
      </div>
    </main>
  );
}
