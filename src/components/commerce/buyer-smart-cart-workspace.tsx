"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwise,
  CheckCircle,
  PaperPlaneTilt,
  ShoppingCart,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ApiEnvelope } from "@/lib/api/responses";
import type {
  BuyerSmartCartApiData,
  BuyerSmartCartApiRequest,
  BuyerSmartCartExample,
} from "@/lib/api/buyer";
import type { BuyerSmartCartExplanationApiData } from "@/lib/api/buyer-smart-cart-explanations";

gsap.registerPlugin(useGSAP);

interface BuyerSmartCartWorkspaceProps {
  initialData: BuyerSmartCartApiData;
  examples: BuyerSmartCartExample[];
}

type RequestState = "idle" | "loading" | "error";
type ExplanationState =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "ready"; data: BuyerSmartCartExplanationApiData; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

export function BuyerSmartCartWorkspace({
  initialData,
  examples,
}: BuyerSmartCartWorkspaceProps) {
  const [data, setData] = useState(initialData);
  const [prompt, setPrompt] = useState(initialData.request.prompt);
  const [buyerId, setBuyerId] = useState(initialData.request.buyerId ?? examples[0]?.buyerId ?? "buyer-aylin");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [explanationState, setExplanationState] = useState<ExplanationState>({ status: "loading" });
  const [explanationRetryKey, setExplanationRetryKey] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const buyerOptions = useMemo(() => {
    const uniqueBuyerIds = Array.from(new Set(examples.map((example) => example.buyerId)));

    return uniqueBuyerIds.map((id) => ({
      id,
      label: getBuyerLabel(id),
    }));
  }, [examples]);

  useGSAP(
    () => {
      gsap.from("[data-cart-reveal]", {
        y: 14,
        opacity: 0,
        duration: 0.48,
        ease: "power3.out",
        stagger: 0.045,
      });
    },
    { scope: resultRef, dependencies: [data.result.prompt] },
  );

  useEffect(() => {
    let isActive = true;

    async function loadExplanation() {
      setExplanationState({ status: "loading" });

      try {
        const response = await fetch("/api/buyer/smart-cart/explanation", {
          body: JSON.stringify({
            buyerId: data.request.buyerId,
            prompt: data.request.prompt,
          }),
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const envelope = (await response.json()) as ApiEnvelope<BuyerSmartCartExplanationApiData>;

        if (!response.ok || !envelope.success) {
          throw new Error(envelope.error?.message ?? "Sepet açıklaması alınamadı.");
        }

        if (isActive) {
          setExplanationState({ data: envelope.data, status: "ready" });
        }
      } catch (error) {
        if (isActive) {
          setExplanationState({
            error: error instanceof Error ? error.message : "Sepet açıklaması alınamadı.",
            status: "error",
          });
        }
      }
    }

    loadExplanation();

    return () => {
      isActive = false;
    };
  }, [data.request.buyerId, data.request.prompt, explanationRetryKey]);

  async function submitSmartCart(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    await requestSmartCart({
      buyerId,
      prompt,
    });
  }

  async function runExample(example: BuyerSmartCartExample) {
    setPrompt(example.prompt);
    setBuyerId(example.buyerId);

    await requestSmartCart({
      buyerId: example.buyerId,
      prompt: example.prompt,
    });
  }

  async function requestSmartCart(request: BuyerSmartCartApiRequest) {
    const normalizedPrompt = request.prompt.trim();

    if (!normalizedPrompt) {
      setRequestState("error");
      setErrorMessage("Sepet kurmak için bir alışveriş komutu yaz.");
      return;
    }

    setRequestState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/buyer/smart-cart", {
        body: JSON.stringify({
          buyerId: request.buyerId,
          prompt: normalizedPrompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const envelope = (await response.json()) as ApiEnvelope<BuyerSmartCartApiData>;

      if (!envelope.success) {
        throw new Error(envelope.error.message);
      }

      setData(envelope.data);
      setPrompt(envelope.data.request.prompt);
      setBuyerId(envelope.data.request.buyerId ?? buyerId);
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(error instanceof Error ? error.message : "Sepet önerisi üretilemedi.");
    }
  }

  const isLoading = requestState === "loading";

  return (
    <div className="space-y-5" ref={resultRef}>
      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-emerald-200/80">Alışveriş asistanı</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            Ne almak istediğini doğal dille yaz.
          </h2>
          <p className="mt-5 max-w-[62ch] text-sm leading-7 text-zinc-500">
            Komut API route’a gider, deterministic smart cart workflow sepeti rol bazlı kurar ve karar
            sinyallerini aynı contract içinde döndürür.
          </p>

          <form className="mt-8 space-y-4" onSubmit={(event) => void submitSmartCart(event)}>
            <div className="grid gap-4 lg:grid-cols-[1fr_190px]">
              <label className="grid gap-2" htmlFor="buyer-command">
                <span className="text-sm text-zinc-400">Komut</span>
                <textarea
                  id="buyer-command"
                  value={prompt}
                  maxLength={280}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="min-h-32 resize-none rounded-[1.35rem] border border-white/10 bg-zinc-950/55 px-4 py-4 text-base leading-7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition placeholder:text-zinc-600 focus:border-emerald-200/40 focus:bg-zinc-950/70"
                  placeholder="Örn. 3.000 TL altında hızlı kargolu ev ofis setup kur."
                />
              </label>

              <label className="grid content-start gap-2" htmlFor="buyer-id">
                <span className="text-sm text-zinc-400">Alıcı profili</span>
                <select
                  id="buyer-id"
                  value={buyerId}
                  onChange={(event) => setBuyerId(event.target.value)}
                  className="min-h-12 rounded-2xl border border-white/10 bg-zinc-950/55 px-4 text-sm text-white outline-none transition focus:border-emerald-200/40"
                >
                  {buyerOptions.map((buyer) => (
                    <option key={buyer.id} value={buyer.id}>
                      {buyer.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <ArrowClockwise size={17} weight="bold" className="animate-spin" />
                  ) : (
                    <PaperPlaneTilt size={17} weight="bold" />
                  )}
                  {isLoading ? "Kuruluyor" : "Sepeti kur"}
                </button>
              </label>
            </div>

            {errorMessage ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                <WarningCircle size={19} weight="duotone" className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {examples.slice(0, 4).map((example) => (
              <button
                key={example.id}
                type="button"
                disabled={isLoading}
                onClick={() => void runExample(example)}
                className="group rounded-2xl border border-white/10 bg-zinc-950/35 p-4 text-left transition hover:border-emerald-200/30 hover:bg-white/[0.055] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{example.label}</span>
                  <Sparkle
                    size={17}
                    weight="duotone"
                    className="text-zinc-500 transition group-hover:text-emerald-200"
                  />
                </span>
                <span className="mt-2 block text-xs text-zinc-500">{example.helper}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">API contract</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                Canlı smart cart isteği
              </h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
              <CheckCircle size={15} weight="fill" />
              {data.contract.method}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 font-mono text-xs leading-6 text-zinc-500">
            {data.contract.endpoint}
            <br />
            envelope: {data.contract.envelope}
            <br />
            source: {data.contract.source}
          </div>

          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {data.result.buyerPersonalizationNotes.slice(0, 4).map((note) => (
              <p key={note} className="py-4 text-sm leading-6 text-zinc-300">
                {note}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]" aria-busy={isLoading}>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Önerilen sepet</h2>
              <p className="mt-2 text-sm text-zinc-500">
                {data.summary.intentLabel} · {data.summary.budgetStatusLabel}
              </p>
            </div>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-300 px-4 text-sm font-medium text-zinc-950">
              <ShoppingCart size={17} weight="bold" />
              {data.summary.itemCount} ürün
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
            <Metric label="Toplam" value={formatTry(data.summary.totalPrice)} />
            <Metric label="Güven" value={`${data.summary.confidenceScore}/100`} />
            <Metric label="Uyarı" value={String(data.summary.warningCount)} />
            <Metric label="Satıcı sinyali" value={String(data.summary.sellerSignalCount)} />
          </div>

          {isLoading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="commerce-skeleton h-16 rounded-2xl bg-white/10" />
              ))}
            </div>
          ) : data.result.selectedItems.length > 0 ? (
            <div className="mt-2 divide-y divide-white/10">
              {data.result.selectedItems.map((item) => (
                <div
                  key={`${data.result.prompt}-${item.productId}`}
                  data-cart-reveal
                  className="grid gap-4 py-5 md:grid-cols-[180px_1fr_140px]"
                >
                  <div>
                    <p className="text-sm text-emerald-200/80">{item.cartRole}</p>
                    <p className="mt-1 text-xs text-zinc-500">{item.category}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{item.productName}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">{item.reasons[0]}</p>
                    <p className="mt-3 font-mono text-xs text-zinc-600">Güven: {item.confidenceScore}/100</p>
                  </div>
                  <div className="font-mono text-lg tracking-[-0.04em] text-white">
                    {formatTry(item.price)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Sepet boş"
              description="Bu komut için seçili ürün dönmedi. Daha net bir ihtiyaç veya bütçe yaz."
            />
          )}
        </div>

        <div className="space-y-5">
          <BuyerSmartCartExplanationPanel
            state={explanationState}
            onRetry={() => setExplanationRetryKey((key) => key + 1)}
          />

          <SidePanel title="Satın almadan önce bil">
            {data.result.warnings.length > 0 ? (
              data.result.warnings.slice(0, 4).map((warning) => (
                <div key={`${warning.title}-${warning.productId ?? "workflow"}`} className="border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-white">{warning.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{warning.message}</p>
                </div>
              ))
            ) : (
              <p className="border-t border-white/10 pt-4 text-sm leading-6 text-zinc-500">
                Bu sepet için kritik satın alma uyarısı yok.
              </p>
            )}
          </SidePanel>

          <SidePanel title="Alternatif ve tamamlayıcı">
            {[...data.result.alternatives.slice(0, 2), ...data.result.complementarySuggestions.slice(0, 2)].map(
              (suggestion) => (
                <div key={`${suggestion.productId}-${suggestion.reason}`} className="border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-white">{suggestion.productName}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{suggestion.reason}</p>
                  <p className="mt-3 font-mono text-xs text-emerald-200/80">{formatTry(suggestion.price)}</p>
                </div>
              ),
            )}
          </SidePanel>

          <SidePanel title="Satıcıya dönen sinyal">
            {data.result.sellerSignalCandidates.slice(0, 3).map((signal) => (
              <div key={`${signal.type}-${signal.summary}`} className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-white">{getSellerSignalLabel(signal.type)}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{signal.summary}</p>
              </div>
            ))}
          </SidePanel>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/55 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-lg font-medium tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function BuyerSmartCartExplanationPanel({
  onRetry,
  state,
}: {
  onRetry: () => void;
  state: ExplanationState;
}) {
  if (state.status === "loading") {
    return (
      <SidePanel title="OpenAI sepet açıklaması">
        <div className="border-t border-white/10 pt-4">
          <div className="commerce-skeleton h-4 w-2/3 rounded-full bg-white/10" />
          <div className="commerce-skeleton mt-3 h-4 w-full rounded-full bg-white/10" />
          <div className="commerce-skeleton mt-3 h-4 w-4/5 rounded-full bg-white/10" />
          <div className="commerce-skeleton mt-5 h-24 rounded-2xl bg-white/10" />
        </div>
      </SidePanel>
    );
  }

  if (state.status === "error") {
    return (
      <SidePanel title="OpenAI sepet açıklaması">
        <div className="border-t border-white/10 pt-4">
          <p className="text-sm leading-6 text-zinc-500">{state.error}</p>
          <button
            className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white transition hover:border-emerald-200/40 hover:text-emerald-100 active:translate-y-px"
            type="button"
            onClick={onRetry}
          >
            Tekrar dene
          </button>
        </div>
      </SidePanel>
    );
  }

  const explanation = state.data.explanation;
  const isGenerated = explanation.status === "generated";

  return (
    <div className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-emerald-200/70">OpenAI sepet açıklaması</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{explanation.headline}</h2>
          </div>
          <span
            className={
              isGenerated
                ? "shrink-0 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 font-mono text-xs text-emerald-100"
                : "shrink-0 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 font-mono text-xs text-amber-100"
            }
          >
            {explanation.provider} · {explanation.model}
          </span>
        </div>
        <p className="text-sm leading-6 text-zinc-500">{isGenerated ? "Canlı model çıktısı" : "Deterministik fallback çıktı"}</p>
      </div>

      <p className="mt-5 text-sm leading-7 text-zinc-400">{explanation.summary}</p>

      <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10 bg-zinc-950/40 px-4">
        {explanation.evidenceBullets.map((item) => (
          <p key={item} className="py-3 text-sm leading-6 text-zinc-500">
            {item}
          </p>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <DecisionNote label="Alıcı kararı" value={explanation.buyerDecision} />
        <DecisionNote label="Risk notu" value={explanation.riskNote} />
        <DecisionNote label="Satıcıya dönen sinyal" value={explanation.sellerSignalBridge} />
        <DecisionNote label="Sepet ayarı" value={explanation.cartAdjustment} />
      </div>

      {explanation.fallbackReason ? (
        <p className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-300/[0.045] p-3 text-xs leading-5 text-amber-100/80">
          {explanation.fallbackReason}
        </p>
      ) : null}
    </div>
  );
}

function DecisionNote({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1 text-sm leading-6 text-white">{value}</p>
    </div>
  );
}

function SidePanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-6">
      <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-zinc-950/35 p-6">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
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

function getBuyerLabel(buyerId: string): string {
  const labels: Record<string, string> = {
    "buyer-aylin": "Aylin",
    "buyer-burak": "Burak",
    "buyer-deniz": "Deniz",
    "buyer-emre": "Emre",
  };

  return labels[buyerId] ?? buyerId;
}

function getSellerSignalLabel(type: string): string {
  const labels: Record<string, string> = {
    bundle_opportunity: "Bundle fırsatı",
    buyer_demand: "Talep sinyali",
    color_demand: "Renk talebi",
    review_friction: "Yorum sürtünmesi",
    shipping_friction: "Kargo sürtünmesi",
  };

  return labels[type] ?? type;
}
