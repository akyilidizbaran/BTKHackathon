"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  ArrowRight,
  House,
  ListChecks,
  Package,
  ShoppingBagOpen,
  ShoppingCart,
  Sparkle,
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
    eyebrow: "Satıcı çalışma alanı",
    href: "/seller",
    alternateHref: "/buyer",
    alternateLabel: "Alıcı alanına geç",
    nav: [
      { href: "/seller", label: "Genel Bakış", icon: House },
      { href: "/seller/actions", label: "Aksiyonlar", icon: ListChecks },
      { href: "/seller/products", label: "Ürünler", icon: Package },
    ],
  },
  buyer: {
    label: "Alıcı",
    eyebrow: "Alıcı çalışma alanı",
    href: "/buyer",
    alternateHref: "/seller",
    alternateLabel: "Satıcı alanına geç",
    nav: [
      { href: "/buyer", label: "Alışveriş Asistanı", icon: Sparkle },
      { href: "/buyer/products", label: "Ürün Keşfi", icon: ShoppingBagOpen },
      { href: "/buyer/cart", label: "Sepet", icon: ShoppingCart },
    ],
  },
} satisfies Record<WorkspaceRole, {
  label: string;
  eyebrow: string;
  href: string;
  alternateHref: string;
  alternateLabel: string;
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
      className="relative min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_78%_12%,rgba(16,185,129,0.12),transparent_28%),linear-gradient(140deg,#09090b_0%,#111113_52%,#171717_100%)] text-zinc-100"
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="pointer-events-none fixed inset-0 commerce-noise" />

      <div className="relative mx-auto grid min-h-[100dvh] max-w-[1500px] grid-cols-1 px-4 py-4 lg:grid-cols-[280px_1fr] lg:gap-5 lg:px-5">
        <aside
          data-shell-reveal
          className="mb-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl lg:sticky lg:top-4 lg:mb-0 lg:h-[calc(100dvh-2rem)]"
        >
          <div className="flex h-full flex-col">
            <Link href="/" className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/5">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-sm font-semibold text-emerald-100">
                CP
              </span>
              <span>
                <span className="block text-sm font-medium text-white">CommercePilot</span>
                <span className="block text-xs text-zinc-500">{config.eyebrow}</span>
              </span>
            </Link>

            <div className="mt-8 space-y-2">
              {config.nav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== config.href && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition active:translate-y-px ${
                      isActive
                        ? "bg-emerald-300 text-zinc-950"
                        : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon size={20} weight={isActive ? "fill" : "duotone"} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <Link
                href={config.alternateHref}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/45 px-4 py-4 text-sm text-zinc-300 transition hover:border-emerald-200/30 hover:text-white active:translate-y-px"
              >
                <span>{config.alternateLabel}</span>
                <ArrowRight size={17} weight="bold" />
              </Link>
            </div>

            <div className="mt-auto hidden border-t border-white/10 pt-5 text-xs leading-6 text-zinc-500 lg:block">
              <p>Deterministik analiz açık. LLM entegrasyonu sonraki milestone’da bağlanacak.</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 pb-8">
          <header
            data-shell-reveal
            className="mb-5 flex flex-col justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.035] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:flex-row md:items-center"
          >
            <div>
              <p className="text-xs text-emerald-200/80">{config.eyebrow}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-white md:text-3xl">
                {config.label} paneli
              </h1>
            </div>
            <div className="grid grid-cols-2 rounded-full border border-white/10 bg-zinc-950/50 p-1 text-sm">
              <Link
                href="/seller"
                className={`rounded-full px-4 py-2 text-center transition active:translate-y-px ${
                  role === "seller" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
                }`}
              >
                Satıcı
              </Link>
              <Link
                href="/buyer"
                className={`rounded-full px-4 py-2 text-center transition active:translate-y-px ${
                  role === "buyer" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
                }`}
              >
                Alıcı
              </Link>
            </div>
          </header>

          <div data-shell-reveal>{children}</div>
        </section>
      </div>
    </main>
  );
}
