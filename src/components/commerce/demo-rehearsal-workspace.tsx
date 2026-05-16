"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  CheckCircle,
  ClipboardText,
  Compass,
  Play,
  Robot,
  ShieldCheck,
  Stack,
  Storefront,
  TerminalWindow,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type {
  DemoProofCard,
  DemoQualityCheck,
  DemoRehearsalData,
  DemoRunbookLane,
} from "@/lib/demo/rehearsal";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface DemoRehearsalWorkspaceProps {
  data: DemoRehearsalData;
}

const cardToneClass = {
  dark: "border-slate-800 bg-slate-950 text-white",
  light: "border-slate-200 bg-white text-slate-950",
  orange: "border-orange-500 bg-orange-500 text-white",
} satisfies Record<DemoProofCard["tone"], string>;

const laneAccentClass = {
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  orange: "bg-orange-50 text-orange-800 ring-orange-200",
  slate: "bg-slate-100 text-slate-800 ring-slate-200",
} satisfies Record<DemoRunbookLane["accent"], string>;

const qualityStatusClass = {
  manual: "bg-slate-100 text-slate-700",
  ready: "bg-emerald-50 text-emerald-700",
  watch: "bg-amber-50 text-amber-700",
} satisfies Record<DemoQualityCheck["status"], string>;

export function DemoRehearsalWorkspace({ data }: DemoRehearsalWorkspaceProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-demo-reveal]",
        {
          opacity: 0,
          y: 22,
        },
        {
          clearProps: "opacity,transform",
          duration: 0.72,
          ease: "power3.out",
          opacity: 1,
          stagger: 0.06,
          y: 0,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-demo-media]").forEach((element) => {
        gsap.fromTo(
          element,
          {
            opacity: 0.78,
            scale: 0.88,
          },
          {
            ease: "none",
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              end: "bottom 36%",
              scrub: true,
              start: "top 88%",
              trigger: element,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-demo-stack]").forEach((element, index) => {
        gsap.fromTo(
          element,
          {
            opacity: 0.76,
            rotate: index % 2 === 0 ? -2 : 2,
            y: 34 + index * 18,
          },
          {
            ease: "none",
            opacity: 1,
            rotate: 0,
            scrollTrigger: {
              end: "top 34%",
              scrub: true,
              start: "top 92%",
              trigger: element,
            },
            y: 0,
          },
        );
      });
    },
    { scope: rootRef },
  );

  return (
    <main ref={rootRef} className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f5efe5] text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(255,90,0,0.16),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(15,23,42,0.10),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-0 commerce-noise opacity-70" />

      <div className="relative mx-auto max-w-[1520px] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <nav
          data-demo-reveal
          aria-label="Demo navigasyonu"
          className="sticky top-4 z-40 mx-auto flex max-w-[1180px] items-center justify-between gap-3 rounded-full border border-white/70 bg-white/82 px-4 py-3 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.9)] backdrop-blur-2xl"
        >
          <Link href="/" className="inline-flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500 text-sm font-bold text-white">
              CP
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold tracking-tight">CommercePilot</span>
              <span className="block text-xs text-slate-500">Demo rehearsal</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
            <a href="#runbook" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950">
              Runbook
            </a>
            <a href="#proof" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950">
              Kanıtlar
            </a>
            <a href="#qa" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950">
              QA
            </a>
          </div>

          <Link
            href={data.ctas.buyer}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-orange-500 active:translate-y-px"
          >
            Demoyu başlat
            <ArrowRight size={16} weight="bold" />
          </Link>
        </nav>

        <section className="grid min-h-[calc(100dvh-6rem)] items-center gap-12 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
          <div data-demo-reveal className="max-w-6xl">
            <p className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
              <Compass size={18} weight="duotone" />
              8R demo hardening
            </p>
            <h1
              className="max-w-6xl text-[clamp(3rem,5vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-slate-950"
              style={{ fontFamily: "\"Cabinet Grotesk\", var(--font-geist-sans)" }}
            >
              Demo akışı{" "}
              <span
                aria-hidden="true"
                data-demo-media
                className="mx-1 inline-block h-[0.62em] w-[1.45em] translate-y-[0.05em] rounded-full bg-cover bg-center align-baseline grayscale contrast-125"
                style={{ backgroundImage: "url(https://picsum.photos/seed/commercepilot-rehearsal/520/240)" }}
              />
              tek nefeste.
            </h1>
            <p className="mt-7 max-w-[64ch] text-lg leading-8 text-slate-600">{data.subheadline}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={data.ctas.buyer}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[0_22px_46px_-30px_rgba(255,90,0,0.95)] transition hover:bg-orange-600 active:translate-y-px"
              >
                <Play size={17} weight="fill" />
                Buyer akışını aç
              </Link>
              <Link
                href={data.ctas.seller}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/70 px-6 text-sm font-semibold text-slate-900 transition hover:border-slate-950 hover:bg-white active:translate-y-px"
              >
                Seller akışını aç
                <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </div>

          <div data-demo-reveal className="relative min-h-[520px]">
            {data.proofCards.map((card, index) => (
              <article
                key={card.id}
                data-demo-stack
                className={`group absolute right-0 w-[min(92vw,470px)] overflow-hidden rounded-[2rem] border p-8 shadow-[0_42px_90px_-60px_rgba(15,23,42,0.9)] transition duration-700 hover:-translate-y-2 ${
                  cardToneClass[card.tone]
                } ${
                  index === 0
                    ? "top-2 lg:right-16"
                    : index === 1
                      ? "top-44 lg:right-36"
                      : "top-[21rem] lg:right-2"
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.22),transparent_32%)] opacity-80" />
                <div className="relative">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/14 text-sm font-bold ring-1 ring-white/18">
                    {index + 1}
                  </span>
                  <h2 className="mt-8 text-4xl font-semibold tracking-[-0.05em]">{card.label}</h2>
                  <p className={`mt-4 text-sm leading-7 ${card.tone === "light" ? "text-slate-600" : "text-white/76"}`}>
                    {card.result}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="runbook" className="py-24 md:py-32">
          <div data-demo-reveal className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2
                className="max-w-5xl text-[clamp(2.65rem,5vw,5.1rem)] font-semibold leading-[0.95] tracking-[-0.06em]"
                style={{ fontFamily: "\"Cabinet Grotesk\", var(--font-geist-sans)" }}
              >
                Runbook net, kanıt görünür.
              </h2>
              <p className="mt-5 max-w-[62ch] text-base leading-8 text-slate-600">
                Her demo yolu route, komut ve expected result ile kapatılır. Bento düzeni tek bakışta sunum sırasını verir.
              </p>
            </div>
            <Link
              href={data.ctas.qa}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-orange-500 active:translate-y-px"
            >
              QA izlerine in
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>

          <div className="grid-flow-dense grid gap-4 lg:grid-cols-6 lg:auto-rows-[minmax(165px,auto)]">
            <RunbookFeatureCard lane={data.runbook[0]} large />
            <QualityMiniCard checks={data.qaChecks} />
            {data.runbook.map((lane) => (
              <RunbookMiniCard key={lane.id} lane={lane} />
            ))}
          </div>
        </section>

        <section id="proof" className="py-24 md:py-32">
          <div data-demo-reveal className="mb-12 grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <div>
              <h2
                className="text-[clamp(2.45rem,4.7vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.06em]"
                style={{ fontFamily: "\"Cabinet Grotesk\", var(--font-geist-sans)" }}
              >
                Prova kartları üst üste kapanır.
              </h2>
            </div>
            <p className="max-w-[62ch] text-base leading-8 text-slate-600">
              Buyer, seller ve floating Agent akışları aynı kalite barını kullanır. Kartlara hover yapınca yatay accordion gibi açılır; sunumda tek aksiyon seçmek kolaylaşır.
            </p>
          </div>

          <div className="flex min-h-[430px] flex-col gap-4 lg:flex-row">
            {data.runbook.map((lane, index) => (
              <article
                key={lane.id}
                data-demo-media
                className={`group relative flex-1 overflow-hidden rounded-[2rem] border border-white/55 bg-slate-950 p-6 text-white shadow-[0_28px_90px_-66px_rgba(15,23,42,0.95)] transition-[flex,transform] duration-700 ease-out hover:flex-[1.45] hover:-translate-y-1 ${
                  index === 1 ? "bg-orange-500" : index === 2 ? "bg-[#16263a]" : "bg-slate-950"
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-24 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-32"
                  style={{ backgroundImage: `url(https://picsum.photos/seed/commercepilot-${lane.id}/900/900)` }}
                />
                <div className="relative flex h-full min-h-[360px] flex-col justify-between">
                  <div>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-white/14 text-sm font-bold ring-1 ring-white/18">
                      {index + 1}
                    </span>
                    <h3 className="mt-8 max-w-[10ch] text-4xl font-semibold tracking-[-0.055em]">{lane.title}</h3>
                    <p className="mt-4 max-w-[36ch] text-sm leading-7 text-white/74">{lane.summary}</p>
                  </div>
                  <Link
                    href={lane.steps[0]?.href ?? data.ctas.buyer}
                    className="inline-flex w-fit min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-orange-50 active:translate-y-px"
                  >
                    Akışı aç
                    <ArrowRight size={16} weight="bold" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="qa" className="py-24 md:py-32">
          <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-[0_34px_110px_-76px_rgba(15,23,42,1)]">
            <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="relative min-h-[440px] p-8 md:p-12">
                <div
                  data-demo-media
                  className="absolute inset-0 bg-cover bg-center opacity-28 grayscale contrast-125"
                  style={{ backgroundImage: "url(https://picsum.photos/seed/commercepilot-terminal/1200/900)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-slate-950/40" />
                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-orange-300">
                      <TerminalWindow size={18} weight="duotone" />
                      QA izleri
                    </p>
                    <h2
                      className="mt-6 max-w-[9ch] text-[clamp(2.7rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.06em]"
                      style={{ fontFamily: "\"Cabinet Grotesk\", var(--font-geist-sans)" }}
                    >
                      Sunuma hazırla.
                    </h2>
                  </div>
                  <p className="max-w-[42ch] text-sm leading-7 text-white/70">
                    Bu liste demo öncesi son kontrol yüzeyidir. Komut kanıtı, browser kanıtı ve route hedefleri tek yerde kalır.
                  </p>
                </div>
              </div>

              <div className="grid gap-px bg-white/10 p-px md:grid-cols-2">
                {data.qaChecks.map((check) => (
                  <article key={check.id} className="bg-slate-900 p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${qualityStatusClass[check.status]}`}>
                          {check.status === "ready" ? "Hazır" : check.status === "manual" ? "Manuel" : "İzle"}
                        </span>
                        <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{check.label}</h3>
                      </div>
                      <ShieldCheck size={23} weight="duotone" className="shrink-0 text-orange-300" />
                    </div>
                    {check.command ? (
                      <p className="mt-6 rounded-2xl bg-white/8 px-4 py-3 font-mono text-sm text-orange-100">{check.command}</p>
                    ) : null}
                    <p className="mt-5 text-sm leading-7 text-white/65">{check.evidence}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32">
          <div data-demo-reveal className="grid gap-10 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_34px_100px_-78px_rgba(15,23,42,0.9)] md:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2
                className="max-w-4xl text-[clamp(2.6rem,5vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.065em]"
                style={{ fontFamily: "\"Cabinet Grotesk\", var(--font-geist-sans)" }}
              >
                Demo kapanışı tek kararda.
              </h2>
              <p className="mt-6 max-w-[58ch] text-base leading-8 text-slate-600">
                8R sonunda hedef, buyer alışveriş kanıtı ile seller audit kanıtını akıcı anlatmak. Bir sonraki teknik başlık provider finalization.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Link className="inline-flex min-h-14 items-center justify-between rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 active:translate-y-px" href={data.ctas.buyer}>
                Buyer demo
                <ArrowRight size={17} weight="bold" />
              </Link>
              <Link className="inline-flex min-h-14 items-center justify-between rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 active:translate-y-px" href={data.ctas.seller}>
                Seller demo
                <ArrowRight size={17} weight="bold" />
              </Link>
              <Link className="inline-flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px" href={data.ctas.qa}>
                QA checklist
                <ArrowRight size={17} weight="bold" />
              </Link>
            </div>
          </div>
        </section>

        <div className="overflow-hidden border-y border-slate-300/70 py-5">
          <div className="seller-products-marquee flex w-max gap-8 pr-8 text-sm font-semibold text-slate-500">
            {[...data.marquee, ...data.marquee].map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-8">
                {item}
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function RunbookFeatureCard({ lane, large }: { large?: boolean; lane: DemoRunbookLane }) {
  return (
    <article
      data-demo-reveal
      className={`group overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-66px_rgba(15,23,42,0.85)] transition duration-700 hover:-translate-y-1 ${
        large ? "lg:col-span-3 lg:row-span-2" : "lg:col-span-2"
      }`}
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${laneAccentClass[lane.accent]}`}>
            {lane.title}
          </span>
          <h3 className="mt-6 max-w-[12ch] text-4xl font-semibold tracking-[-0.055em] text-slate-950">
            İlk akış buyer ile açılır.
          </h3>
        </div>
        <ClipboardText size={30} weight="duotone" className="shrink-0 text-orange-600" />
      </div>
      <div className="mt-8 grid gap-3">
        {lane.steps.map((step, index) => (
          <Link
            key={step.id}
            href={step.href}
            className="group/step grid gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-orange-50 active:translate-y-px md:grid-cols-[44px_1fr_auto]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-bold text-slate-950 ring-1 ring-slate-200">
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">{step.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{step.expected}</span>
            </span>
            <ArrowRight size={16} weight="bold" className="hidden self-center text-slate-400 transition group-hover/step:text-orange-600 md:block" />
          </Link>
        ))}
      </div>
    </article>
  );
}

function QualityMiniCard({ checks }: { checks: DemoQualityCheck[] }) {
  const readyCount = checks.filter((check) => check.status === "ready").length;

  return (
    <article data-demo-reveal className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_28px_80px_-66px_rgba(15,23,42,0.95)] lg:col-span-3">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-orange-300">QA smoke</p>
          <h3 className="mt-5 text-3xl font-semibold tracking-[-0.05em]">Kanıtlar tek yerde.</h3>
        </div>
        <CheckCircle size={29} weight="duotone" className="shrink-0 text-emerald-300" />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
        <Metric label="Hazır kontrol" value={`${readyCount}/${checks.length}`} />
        <Metric label="Sıradaki" value="8R" />
      </div>
    </article>
  );
}

function RunbookMiniCard({ lane }: { lane: DemoRunbookLane }) {
  const Icon = lane.id === "buyer" ? Storefront : lane.id === "seller" ? Stack : Robot;

  return (
    <Link
      data-demo-reveal
      href={lane.steps[0]?.href ?? "/demo"}
      className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-62px_rgba(15,23,42,0.82)] transition duration-700 hover:-translate-y-1 hover:border-orange-200 active:translate-y-px lg:col-span-1"
    >
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ${laneAccentClass[lane.accent]}`}>
        <Icon size={23} weight="duotone" />
      </span>
      <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-slate-950">{lane.title}</h3>
      <p className="mt-3 text-xs leading-5 text-slate-500">{lane.summary}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-orange-700">
        İlk route
        <ArrowRight size={14} weight="bold" className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
