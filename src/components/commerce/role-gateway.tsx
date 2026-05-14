"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChartLineUp, MagnifyingGlass, ShoppingBagOpen, Storefront } from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const roles = [
  {
    title: "Satıcı Alanı",
    eyebrow: "Satıcı merkezi",
    description:
      "Ürünlerini, satılmayan stoklarını ve agent destekli listeleme aksiyonlarını yönet.",
    href: "/seller",
    cta: "Satıcı olarak devam et",
    icon: ChartLineUp,
    details: ["Ürün yönetimi", "Satış ve stok", "Agent aksiyonları"],
  },
  {
    title: "Alıcı Alanı",
    eyebrow: "Marketplace",
    description:
      "Kategoriler, ürünler, sepet ve sağ altta yaşayacak agent alışveriş yardımcısı.",
    href: "/buyer",
    cta: "Alıcı olarak devam et",
    icon: ShoppingBagOpen,
    details: ["Ürün keşfi", "Sepet önerisi", "Kişisel uyarılar"],
  },
];

export function RoleGateway() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-gateway-reveal]");

      gsap.from(items, {
        y: 22,
        opacity: 0,
        duration: 0.9,
        stagger: 0.09,
        ease: "power3.out",
      });
    },
    { scope: rootRef },
  );

  return (
    <main
      ref={rootRef}
      className="relative min-h-[100dvh] overflow-x-hidden bg-[#f6f7fb] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(249,115,22,0.09),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(5,150,105,0.07),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 commerce-noise" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-[1400px] flex-col">
        <nav
          data-gateway-reveal
          className="flex items-center justify-between border-b border-slate-200 pb-5"
          aria-label="Ana navigasyon"
        >
          <Link href="/" className="group inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.8)]">
              CP
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-slate-950">CommercePilot</span>
              <span className="block text-xs text-slate-500">Agent destekli e-ticaret</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-sm text-slate-600 shadow-sm sm:flex">
            <Link className="rounded-full px-4 py-2 transition hover:bg-orange-50 hover:text-orange-700 active:translate-y-px" href="/seller">
              Satıcı
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-orange-50 hover:text-orange-700 active:translate-y-px" href="/buyer">
              Alıcı
            </Link>
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[0.86fr_1.14fr] lg:py-10">
          <div data-gateway-reveal className="max-w-4xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
              <Storefront size={18} weight="duotone" />
              Light marketplace pivotu başladı
            </div>
            <h1 className="max-w-5xl text-[clamp(2.65rem,5vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950">
              CommercePilot artık tanıdık bir alışveriş yüzeyi.
            </h1>
            <p className="mt-7 max-w-[62ch] text-base leading-8 text-slate-600 sm:text-lg">
              Alıcı mağazada gezer, satıcı panelini yönetir. Sağ altta yaşayacak agent pet ise sepet
              kurma, ürün uyarısı ve listeleme aksiyonlarını bağlam içinde taşır.
            </p>
            <div className="mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <MagnifyingGlass size={20} weight="bold" className="text-slate-400" />
              <span className="text-sm text-slate-500">Ürün, kategori veya agent komutu ara</span>
            </div>
          </div>

          <div data-gateway-reveal className="grid gap-4 md:grid-cols-2 lg:gap-5">
            {roles.map((role, index) => {
              const Icon = role.icon;

              return (
                <Link
                  key={role.title}
                  href={role.href}
                  className="group relative min-h-[430px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-60px_rgba(15,23,42,0.85)] transition duration-500 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_34px_88px_-58px_rgba(249,115,22,0.65)] active:translate-y-0 md:p-7"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-sm font-medium text-orange-700">{role.eyebrow}</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                        {role.title}
                      </h2>
                    </div>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-700">
                      <Icon size={24} weight="duotone" />
                    </span>
                  </div>
                  <p className="mt-6 text-sm leading-7 text-slate-600">{role.description}</p>

                  <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
                    {role.details.map((detail) => (
                      <div key={detail} className="flex items-center justify-between py-4 text-sm text-slate-600">
                        <span>{detail}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      </div>
                    ))}
                  </div>

                  <div className="absolute inset-x-6 bottom-6 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_-28px_rgba(15,23,42,0.9)] transition group-hover:bg-orange-500">
                    <span>{role.cta}</span>
                    <ArrowRight size={18} weight="bold" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
