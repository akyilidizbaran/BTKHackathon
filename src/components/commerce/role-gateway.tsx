"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChartLineUp, ShoppingBagOpen } from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const roles = [
  {
    title: "Satıcı Alanı",
    eyebrow: "Büyüme aksiyonları",
    description:
      "Stok, yorum, listeleme, satış ve kârlılık sinyallerini tek çalışma alanında oku.",
    href: "/seller",
    cta: "Satıcı olarak devam et",
    icon: ChartLineUp,
    details: ["Bugünkü 5 aksiyon", "Ürün sağlık radarı", "Kârlılık ve iade sinyali"],
  },
  {
    title: "Alıcı Alanı",
    eyebrow: "Akıllı alışveriş",
    description:
      "İhtiyaç, bütçe, renk, teslimat ve kişisel tercihleri birlikte değerlendiren sepet önerileri gör.",
    href: "/buyer",
    cta: "Alıcı olarak devam et",
    icon: ShoppingBagOpen,
    details: ["Doğal dil komutu", "Rol bazlı sepet", "Satın almadan önce uyarılar"],
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
      className="relative min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.12),transparent_28%),linear-gradient(135deg,#09090b_0%,#121214_46%,#18181b_100%)] px-4 py-5 text-zinc-100 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none fixed inset-0 commerce-noise" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-[1400px] flex-col">
        <nav
          data-gateway-reveal
          className="flex items-center justify-between border-b border-white/10 pb-5"
          aria-label="Ana navigasyon"
        >
          <Link href="/" className="group inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-sm font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
              CP
            </span>
            <span>
              <span className="block text-sm font-medium tracking-tight text-white">CommercePilot</span>
              <span className="block text-xs text-zinc-500">Çift taraflı ticaret zekası</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:flex">
            <Link className="rounded-full px-4 py-2 transition hover:bg-white/10 active:translate-y-px" href="/seller">
              Satıcı
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-white/10 active:translate-y-px" href="/buyer">
              Alıcı
            </Link>
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[0.86fr_1.14fr] lg:py-10">
          <div data-gateway-reveal className="max-w-4xl">
            <p className="mb-6 max-w-xl text-sm leading-6 text-emerald-200/80">
              Aynı veri omurgası, iki farklı karar yüzeyi.
            </p>
            <h1 className="max-w-4xl text-[clamp(2.75rem,5vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.065em] text-white">
              Alışveriş zekasını iki taraftan yönet.
            </h1>
            <p className="mt-7 max-w-[58ch] text-base leading-8 text-zinc-400 sm:text-lg">
              CommercePilot, alıcı ihtiyaçlarını ve satıcı sinyallerini aynı sistemde okur.
              Bu ilk arayüzde rolünü seçip ilgili çalışma alanına geçebilirsin.
            </p>
          </div>

          <div data-gateway-reveal className="grid gap-4 md:grid-cols-2 lg:gap-5">
            {roles.map((role, index) => {
              const Icon = role.icon;

              return (
                <Link
                  key={role.title}
                  href={role.href}
                  className="group relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_30px_80px_-48px_rgba(16,185,129,0.55)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-emerald-200/30 hover:bg-white/[0.07] active:translate-y-0 md:p-7"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent" />
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-sm text-emerald-200/80">{role.eyebrow}</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                        {role.title}
                      </h2>
                    </div>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-zinc-950/50 text-emerald-100">
                      <Icon size={24} weight="duotone" />
                    </span>
                  </div>
                  <p className="mt-6 text-sm leading-7 text-zinc-400">{role.description}</p>

                  <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                    {role.details.map((detail) => (
                      <div key={detail} className="flex items-center justify-between py-4 text-sm text-zinc-300">
                        <span>{detail}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                      </div>
                    ))}
                  </div>

                  <div className="absolute inset-x-6 bottom-6 flex items-center justify-between rounded-full border border-white/10 bg-zinc-950/55 px-4 py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition group-hover:border-emerald-200/30 group-hover:bg-emerald-300 group-hover:text-zinc-950">
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
