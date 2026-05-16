"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  LockKey,
  Package,
  PaperPlaneTilt,
  Robot,
  ShieldCheck,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ApiEnvelope } from "@/lib/api/responses";
import {
  sellerAgentEndpoint,
  type SellerAgentApiData,
  type SellerAgentExample,
  type SellerAgentProductFinding,
} from "@/lib/api/seller-agent";
import { AgentRuntimePanel } from "@/components/commerce/agent-runtime-panel";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface SellerAgentWorkspaceProps {
  examples: SellerAgentExample[];
  initialData: SellerAgentApiData;
}

type RequestState = "idle" | "loading" | "error";

export function SellerAgentWorkspace({ examples, initialData }: SellerAgentWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState(initialData);
  const [prompt, setPrompt] = useState(initialData.request.prompt);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = requestState === "loading";
  const primaryFinding = data.productFindings[0];
  const marqueeItems = useMemo(
    () => [
      data.summary.focusLabel,
      `${data.summary.productCount} ürün`,
      `${data.summary.actionCount} aksiyon`,
      `Sahip: ${data.summary.recommendedOwner}`,
      "Onay olmadan mutation yok",
      data.source.actionsEndpoint,
    ],
    [data.source.actionsEndpoint, data.summary],
  );

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-seller-agent-reveal]",
        {
          opacity: 0,
          y: 18,
        },
        {
          clearProps: "opacity,transform",
          duration: 0.58,
          ease: "power3.out",
          opacity: 1,
          stagger: 0.05,
          y: 0,
        },
      );

      gsap.utils.toArray<HTMLElement>("[data-seller-agent-media]").forEach((element) => {
        gsap.fromTo(
          element,
          {
            opacity: 0.78,
            scale: 0.92,
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

      gsap.utils.toArray<HTMLElement>("[data-seller-agent-stack]").forEach((element, index) => {
        gsap.fromTo(
          element,
          {
            opacity: 0.72,
            y: 34 + index * 8,
          },
          {
            ease: "power2.out",
            opacity: 1,
            scrollTrigger: {
              end: "top 28%",
              scrub: true,
              start: "top 88%",
              trigger: element,
            },
            y: 0,
          },
        );
      });

      const pinned = rootRef.current?.querySelector<HTMLElement>("[data-seller-agent-pin]");
      const pinWrap = pinned?.parentElement;

      if (pinned && pinWrap && window.innerWidth >= 1024) {
        ScrollTrigger.create({
          end: "bottom bottom",
          pin: pinned,
          pinSpacing: false,
          start: "top 96px",
          trigger: pinWrap,
        });
      }
    },
    { dependencies: [data.request.prompt], scope: rootRef },
  );

  async function submitPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await requestAgent(prompt);
  }

  async function runExample(example: SellerAgentExample) {
    setPrompt(example.prompt);
    await requestAgent(example.prompt);
  }

  async function requestAgent(nextPrompt: string) {
    const normalizedPrompt = nextPrompt.trim();

    if (!normalizedPrompt) {
      setRequestState("error");
      setErrorMessage("Agent'in analiz yapabilmesi için ürün, risk veya aksiyon komutu yaz.");
      return;
    }

    setRequestState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(sellerAgentEndpoint, {
        body: JSON.stringify({
          prompt: normalizedPrompt,
          sellerId: data.request.sellerId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const envelope = (await response.json()) as ApiEnvelope<SellerAgentApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Seller Agent analizi üretilemedi.");
      }

      setData(envelope.data);
      setPrompt(envelope.data.request.prompt);
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(error instanceof Error ? error.message : "Seller Agent analizi üretilemedi.");
    }
  }

  return (
    <div ref={rootRef} className="overflow-x-hidden">
      <section className="grid grid-flow-dense gap-5 xl:grid-cols-12">
        <div
          data-seller-agent-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] xl:col-span-8 md:p-7"
        >
          <div className="min-h-[360px]">
            <h2 className="max-w-6xl text-[clamp(2.65rem,5vw,5.45rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-slate-950">
              Satıcı agent{" "}
              {primaryFinding ? (
                <span
                  aria-label={primaryFinding.product.image.alt}
                  className="mx-2 hidden h-12 w-28 overflow-hidden rounded-full border border-slate-200 bg-slate-50 bg-[length:500%_400%] bg-no-repeat align-middle sm:inline-block md:h-14 md:w-36"
                  role="img"
                  style={{
                    backgroundImage: `url(${primaryFinding.product.image.src})`,
                    backgroundPosition: primaryFinding.product.image.position,
                  }}
                />
              ) : null}
              ürünleri kanıtla okur.
            </h2>
            <p className="mt-5 max-w-[72ch] text-sm leading-7 text-slate-600">
              Komutu yaz, Agent ürünleri health score, stok, satış hızı, yorum ve bağlı seller action kanıtıyla sıralasın.
              Bu adım yalnızca analiz ve öneri üretir; listeleme değişikliği için ayrıca onay gerekir.
            </p>

            <form className="mt-8 space-y-4" onSubmit={(event) => void submitPrompt(event)}>
              <label className="grid gap-2" htmlFor="seller-agent-prompt">
                <span className="text-sm font-semibold text-slate-800">Satıcı komutu</span>
                <textarea
                  id="seller-agent-prompt"
                  maxLength={360}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="min-h-32 resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Örn. Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla."
                />
              </label>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="commerce-skeleton h-4 w-4 rounded-full bg-white/40" />
                  ) : (
                    <PaperPlaneTilt size={17} weight="bold" />
                  )}
                  {isLoading ? "Analiz ediliyor" : "Agent'a Sor"}
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  POST {sellerAgentEndpoint} · deterministic workflow · runtime mutation yok
                </p>
              </div>

              {errorMessage ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  <WarningCircle size={19} weight="duotone" className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}
            </form>
          </div>
        </div>

        <aside
          data-seller-agent-reveal
          className="overflow-hidden rounded-lg bg-slate-950 text-[#fff] shadow-[0_22px_56px_-36px_rgba(15,23,42,0.95)] xl:col-span-4"
        >
          <div className="p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#fff]">Agent sınırı</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{data.message.safetyNote}</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-200">
                <Robot size={21} weight="duotone" />
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10">
              <HeroMetric label="Odak" value={data.summary.focusLabel} />
              <HeroMetric label="Ürün" value={String(data.summary.productCount)} />
              <HeroMetric label="Aksiyon" value={String(data.summary.actionCount)} />
              <HeroMetric label="Sahip" value={data.summary.recommendedOwner} />
            </div>
          </div>

          <div className="border-y border-white/10 py-4">
            <div className="seller-agent-marquee flex min-w-max gap-8 whitespace-nowrap px-5 text-sm font-semibold text-slate-300">
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <span key={`${item}-${index}`}>{item}</span>
              ))}
            </div>
          </div>

          <div className="p-5 md:p-7">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                  <ShieldCheck size={20} weight="duotone" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#fff]">Yetki modu</p>
                  <p className="text-xs text-slate-400">Öneri ve taslak</p>
                </div>
              </div>
              <Link
                href="/seller/profile"
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 active:translate-y-px"
              >
                Yetkileri aç
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>

            <div className="mt-4">
              <AgentRuntimePanel runtime={data.runtime} variant="dark" />
            </div>
          </div>
        </aside>

        <div data-seller-agent-reveal className="xl:col-span-12">
          <div className="grid grid-flow-dense gap-3 md:grid-cols-4">
            {examples.map((example) => (
              <button
                key={example.id}
                type="button"
                disabled={isLoading}
                onClick={() => void runExample(example)}
                className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-950">{example.label}</span>
                  <Sparkle size={17} weight="duotone" className="text-slate-400 transition group-hover:text-orange-600" />
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-500">{example.helper}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-flow-dense gap-5 xl:grid-cols-12">
        <aside data-seller-agent-pin className="xl:col-span-3">
          <ConversationPanel data={data} isLoading={isLoading} />
        </aside>

        <div data-seller-agent-reveal className="min-w-0 xl:col-span-6">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Ürün kanıt sırası</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {data.summary.focusLabel} için health, stok, satış ve yorum sinyalleri birlikte okunur.
              </p>
            </div>
            <Link
              href={data.source.productsEndpoint.replace("/api", "")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              Ürünleri aç
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>

          {isLoading ? (
            <ProductFindingSkeleton />
          ) : data.productFindings.length > 0 ? (
            <div className="grid grid-flow-dense gap-3">
              {data.productFindings.map((finding) => (
                <ProductFindingCard key={`${data.request.prompt}-${finding.id}`} finding={finding} />
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Ürün kanıtı bulunamadı"
              description="Komutu daha net bir risk alanıyla yaz veya ürünler sayfasından odak filtresi seç."
            />
          )}
        </div>

        <aside data-seller-agent-reveal className="space-y-5 xl:col-span-3">
          <EvidenceSummaryPanel data={data} />
          <NextStepsPanel data={data} />
        </aside>
      </section>

      <section
        data-seller-agent-reveal
        className="mt-10 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] lg:grid-cols-[minmax(0,1fr)_380px] md:p-7"
      >
        <div>
          <h2 className="max-w-4xl text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-slate-950 md:text-4xl">
            Öneri var, uygulama yok: onay sınırı açık kalır.
          </h2>
          <p className="mt-4 max-w-[72ch] text-sm leading-7 text-slate-600">
            8L yalnızca analiz, sıralama ve route yönlendirmesi yapar. Seller mutation, before/after preview ve audit log
            sonraki aşamada ayrı onay akışıyla kurulacak.
          </p>
        </div>

        {data.draftPreview ? (
          <div className="rounded-lg bg-slate-950 p-4 text-[#fff]">
            <div className="flex items-center gap-2 text-orange-200">
              <LockKey size={18} weight="duotone" />
              <p className="text-sm font-semibold">{data.draftPreview.title}</p>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6">
              <PreviewLine label="Önce" value={data.draftPreview.before} />
              <PreviewLine label="Sonra" value={data.draftPreview.after} />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">{data.draftPreview.helper}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ConversationPanel({ data, isLoading }: { data: SellerAgentApiData; isLoading: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Agent cevabı</h2>
          <p className="mt-1 text-sm text-slate-500">Deterministik kanıtla konuşur.</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-[#fff]">
          <Robot size={20} weight="duotone" />
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <ChatBubble tone="agent">
          Satıcı verisini ürün, risk ve aksiyon contract’larından okuyorum. Komutu yaz, onay olmadan değişiklik yapmam.
        </ChatBubble>
        <ChatBubble tone="user">{data.request.prompt}</ChatBubble>
        {isLoading ? (
          <div className="space-y-3 rounded-lg bg-slate-100 p-4">
            <div className="commerce-skeleton h-4 w-4/5 rounded-full bg-slate-200" />
            <div className="commerce-skeleton h-4 w-3/5 rounded-full bg-slate-200" />
          </div>
        ) : (
          <ChatBubble tone="agent">
            <span className="block font-semibold text-slate-950">{data.message.headline}</span>
            <span className="mt-2 block">{data.message.content}</span>
          </ChatBubble>
        )}
      </div>
    </div>
  );
}

function ProductFindingCard({ finding }: { finding: SellerAgentProductFinding }) {
  const product = finding.product;

  return (
    <article
      data-seller-agent-stack
      className="group rounded-lg border border-slate-200 bg-white p-3 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_24px_58px_-44px_rgba(15,23,42,0.68)]"
    >
      <div className="grid gap-5 lg:grid-cols-[112px_minmax(0,1fr)_128px] lg:items-center">
        <Link href={product.href} className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <span
            data-seller-agent-media
            aria-label={product.image.alt}
            className="block aspect-[4/3] bg-[length:500%_400%] bg-no-repeat transition duration-700 group-hover:scale-105"
            role="img"
            style={{
              backgroundImage: `url(${product.image.src})`,
              backgroundPosition: product.image.position,
            }}
          />
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {product.categoryLabel}
            </span>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
              Agent skoru {finding.score}
            </span>
          </div>
          <Link
            href={product.href}
            className="mt-3 block text-xl font-semibold leading-tight tracking-[-0.035em] text-slate-950 hover:text-orange-700"
          >
            {finding.rank}. {product.name}
          </Link>
          <p className="mt-2 text-sm leading-6 text-slate-600">{finding.reason}</p>
        </div>

        <div className="grid gap-2">
          {finding.linkedAction ? (
            <Link
              href={finding.linkedAction.href}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-3 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
            >
              Aksiyon
              <ArrowRight size={14} weight="bold" />
            </Link>
          ) : (
            <Link
              href="/seller/actions"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-3 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
            >
              Kuyruk
              <ArrowRight size={14} weight="bold" />
            </Link>
          )}
          <Link
            href={product.href}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
          >
            Ürün
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {finding.evidence.map((item) => (
          <EvidenceMetric key={`${finding.id}-${item.label}`} item={item} />
        ))}
      </div>
    </article>
  );
}

function EvidenceSummaryPanel({ data }: { data: SellerAgentApiData }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Kanıt özeti</h2>
      <div className="mt-5 grid gap-2">
        {data.evidenceSummary.map((item) => (
          <EvidenceMetric key={`${item.label}-${item.value}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function NextStepsPanel({ data }: { data: SellerAgentApiData }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Sonraki adım</h2>
      <div className="mt-5 space-y-3">
        {data.nextSteps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className="group block rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{step.title}</p>
              {step.requiresApproval ? (
                <LockKey className="shrink-0 text-orange-600" size={17} weight="duotone" />
              ) : (
                <ArrowRight className="shrink-0 text-slate-400 transition group-hover:text-orange-600" size={17} weight="bold" />
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{step.detail}</p>
            <p className="mt-3 text-xs font-semibold text-orange-700">{step.ctaLabel}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-[#fff]">{value}</p>
    </div>
  );
}

function EvidenceMetric({ item }: { item: SellerAgentApiData["evidenceSummary"][number] }) {
  const className =
    item.tone === "danger"
      ? "bg-red-50 text-red-700"
      : item.tone === "warning"
        ? "bg-orange-50 text-orange-700"
        : item.tone === "good"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-lg p-3 ${className}`}>
      <p className="text-xs opacity-75">{item.label}</p>
      <p className="mt-1 font-mono text-sm font-semibold">{item.value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 opacity-75">{item.helper}</p>
    </div>
  );
}

function ChatBubble({ children, tone }: { children: ReactNode; tone: "agent" | "user" }) {
  return (
    <div
      className={
        tone === "user"
          ? "ml-auto max-w-[88%] rounded-lg bg-orange-500 p-4 text-sm font-semibold leading-6 text-[#fff]"
          : "max-w-[92%] rounded-lg bg-slate-100 p-4 text-sm leading-6 text-slate-700"
      }
    >
      {children}
    </div>
  );
}

function ProductFindingSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid gap-5 lg:grid-cols-[112px_minmax(0,1fr)_128px] lg:items-center">
            <div className="commerce-skeleton aspect-[4/3] rounded-lg bg-slate-100" />
            <div>
              <div className="commerce-skeleton h-5 w-3/4 rounded-full bg-slate-100" />
              <div className="commerce-skeleton mt-4 h-4 w-full rounded-full bg-slate-100" />
              <div className="commerce-skeleton mt-3 h-4 w-4/5 rounded-full bg-slate-100" />
            </div>
            <div className="commerce-skeleton h-10 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <Package className="mx-auto text-slate-300" size={34} weight="duotone" />
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-orange-200">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-100">{value}</p>
    </div>
  );
}
