"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  PaperPlaneTilt,
  Robot,
  ShoppingCartSimple,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ApiEnvelope } from "@/lib/api/responses";
import type { BuyerSmartCartExample } from "@/lib/api/buyer";
import {
  buyerAgentApplyEndpoint,
  buyerAgentEndpoint,
  type BuyerAgentApiData,
  type BuyerAgentApplyApiData,
  type BuyerAgentApplyStrategy,
} from "@/lib/api/buyer-agent";
import {
  buyerCartUpdatedEvent,
  readBuyerCartItems,
} from "@/lib/cart/buyer-cart";
import { applyBuyerAgentCartMutation } from "@/lib/agents/buyer-cart-apply-client";
import {
  BuyerAgentApplyPanel,
  BuyerAgentConversationPanel,
  BuyerAgentEmptyPanel,
  BuyerAgentFaq,
  BuyerRecommendationCard,
  BuyerRecommendationSkeleton,
  type BuyerAgentApplyState,
} from "@/components/commerce/buyer-agent-panels";

gsap.registerPlugin(useGSAP);

interface BuyerAgentWorkspaceProps {
  examples: BuyerSmartCartExample[];
  initialData: BuyerAgentApiData;
}

type RequestState = "idle" | "loading" | "error";
type ApplyState = BuyerAgentApplyState;

export function BuyerAgentWorkspace({ examples, initialData }: BuyerAgentWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState(initialData);
  const [prompt, setPrompt] = useState(initialData.request.prompt);
  const [buyerId, setBuyerId] = useState(initialData.request.buyerId ?? examples[0]?.buyerId ?? "buyer-aylin");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applyState, setApplyState] = useState<ApplyState>({ status: "idle" });
  const [cartItemCount, setCartItemCount] = useState(0);

  const buyerOptions = useMemo(() => {
    const buyerIds = Array.from(new Set(examples.map((example) => example.buyerId)));

    return buyerIds.map((id) => ({
      id,
      label: getBuyerLabel(id),
    }));
  }, [examples]);

  const isLoading = requestState === "loading";
  const hasRecommendations = data.recommendations.length > 0;
  const applyItems = data.applyPreview.items;

  useEffect(() => {
    function syncCartCount() {
      setCartItemCount(readBuyerCartItems().reduce((sum, item) => sum + item.quantity, 0));
    }

    syncCartCount();
    window.addEventListener("storage", syncCartCount);
    window.addEventListener(buyerCartUpdatedEvent, syncCartCount);

    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener(buyerCartUpdatedEvent, syncCartCount);
    };
  }, []);

  useGSAP(
    () => {
      gsap.from("[data-agent-reveal]", {
        y: 16,
        opacity: 0,
        duration: 0.52,
        ease: "power3.out",
        stagger: 0.055,
      });
    },
    { scope: rootRef, dependencies: [data.request.prompt] },
  );

  async function submitPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await requestAgent({ buyerId, prompt });
  }

  async function runExample(example: BuyerSmartCartExample) {
    setPrompt(example.prompt);
    setBuyerId(example.buyerId);
    await requestAgent({ buyerId: example.buyerId, prompt: example.prompt });
  }

  async function requestAgent(request: { buyerId: string; prompt: string }) {
    const normalizedPrompt = request.prompt.trim();

    if (!normalizedPrompt) {
      setRequestState("error");
      setErrorMessage("Agent'in ürün seçebilmesi için bir ihtiyaç, stil veya bütçe yaz.");
      return;
    }

    setRequestState("loading");
    setErrorMessage(null);
    setApplyState({ status: "idle" });

    try {
      const response = await fetch(buyerAgentEndpoint, {
        body: JSON.stringify({
          buyerId: request.buyerId,
          prompt: normalizedPrompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const envelope = (await response.json()) as ApiEnvelope<BuyerAgentApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Agent önerisi üretilemedi.");
      }

      setData(envelope.data);
      setPrompt(envelope.data.request.prompt);
      setBuyerId(envelope.data.request.buyerId ?? buyerId);
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(error instanceof Error ? error.message : "Agent önerisi üretilemedi.");
    }
  }

  async function applyRecommendations(strategy: BuyerAgentApplyStrategy) {
    if (applyItems.length === 0) {
      setApplyState({ message: "Sepete uygulanacak ürün bulunamadı.", status: "error" });
      return;
    }

    setApplyState({ status: "loading", strategy });

    try {
      const response = await fetch(buyerAgentApplyEndpoint, {
        body: JSON.stringify({
          actorId: data.request.buyerId,
          items: applyItems,
          sourceRuntimeId: data.runtime.runtimeId,
          strategy,
          surface: "route",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const envelope = (await response.json()) as ApiEnvelope<BuyerAgentApplyApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Sepet uygulanamadı.");
      }

      const result = applyBuyerAgentCartMutation(envelope.data, { surface: "route" });

      setApplyState({
        cartItemCount: result.cartItemCount,
        itemCount: result.itemCount,
        message: result.message,
        productCount: result.productCount,
        status: "applied",
        storageEvent: result.storageEvent,
        strategy: result.strategy,
        strategyLabel: result.strategyLabel,
        toolId: result.toolId,
      });
    } catch (error) {
      setApplyState({
        message: error instanceof Error ? error.message : "Sepet uygulanamadı.",
        status: "error",
      });
    }
  }

  return (
    <div ref={rootRef} className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <div
          data-agent-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7"
        >
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <h2 className="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-5xl">
                Ne aradığını yaz, katalogdan seçeyim.
              </h2>
              <p className="mt-4 max-w-[62ch] text-sm leading-6 text-slate-600">
                Agent yalnızca CommercePilot kataloğundaki ürünleri önerir. Onay vermeden sepete ürün eklemez.
              </p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500 text-[#fff]">
                  <Robot size={20} weight="duotone" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Agent aktif</p>
                  <p className="text-xs text-slate-500">{cartItemCount} ürün sepette</p>
                </div>
              </div>
              <Link
                href="/buyer/cart"
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
              >
                Sepete Git
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </div>

          <form className="mt-7 space-y-4" onSubmit={(event) => void submitPrompt(event)}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
              <label className="grid gap-2" htmlFor="buyer-agent-prompt">
                <span className="text-sm font-semibold text-slate-800">Alışveriş komutu</span>
                <textarea
                  id="buyer-agent-prompt"
                  maxLength={280}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="min-h-36 resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="Örn. 3000 TL altı old-money kazak ve pantolon getir."
                />
                <span className="text-xs text-slate-500">
                  Bütçe, teslimat hızı, stil veya kullanım amacını birlikte yazabilirsin.
                </span>
              </label>

              <div className="grid content-start gap-3">
                <label className="grid gap-2" htmlFor="buyer-agent-profile">
                  <span className="text-sm font-semibold text-slate-800">Alıcı profili</span>
                  <select
                    id="buyer-agent-profile"
                    value={buyerId}
                    onChange={(event) => setBuyerId(event.target.value)}
                    className="min-h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  >
                    {buyerOptions.map((buyer) => (
                      <option key={buyer.id} value={buyer.id}>
                        {buyer.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="commerce-skeleton h-4 w-4 rounded-full bg-white/40" />
                  ) : (
                    <PaperPlaneTilt size={17} weight="bold" />
                  )}
                  {isLoading ? "Seçiliyor" : "Agent'a Sor"}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <WarningCircle size={19} weight="duotone" className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </form>

          <div className="mt-6 grid grid-flow-dense gap-3 md:grid-cols-2">
            {examples.slice(0, 4).map((example) => (
              <button
                key={example.id}
                type="button"
                disabled={isLoading}
                onClick={() => void runExample(example)}
                className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-950">{example.label}</span>
                  <Sparkle size={17} weight="duotone" className="text-slate-400 transition group-hover:text-orange-600" />
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-500">{example.prompt}</span>
              </button>
            ))}
          </div>
        </div>

        <div data-agent-reveal className="space-y-5">
          <BuyerAgentConversationPanel data={data} isLoading={isLoading} />
          <BuyerAgentFaq />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div
          data-agent-reveal
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-6"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">Önerilen Ürünler</h2>
              <p className="mt-2 text-sm text-slate-500">
                {data.summary.intentLabel} · {data.summary.budgetStatusLabel}
              </p>
            </div>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-orange-50 px-4 text-sm font-semibold text-orange-700 ring-1 ring-orange-200">
              <ShoppingCartSimple size={17} weight="bold" />
              {data.summary.itemCount} ürün
            </span>
          </div>

          {isLoading ? (
            <BuyerRecommendationSkeleton />
          ) : hasRecommendations ? (
            <div className="mt-5 grid grid-flow-dense gap-4 md:grid-cols-2">
              {data.recommendations.map((recommendation, index) => (
                <BuyerRecommendationCard
                  key={`${data.request.prompt}-${recommendation.product.id}`}
                  index={index}
                  recommendation={recommendation}
                />
              ))}
            </div>
          ) : (
            <BuyerAgentEmptyPanel
              title="Ürün bulunamadı"
              description="Komutu biraz daha net yaz veya mevcut katalog kategorilerinden birini belirt."
            />
          )}
        </div>

        <BuyerAgentApplyPanel
          applyState={applyState}
          data={data}
          disabled={isLoading || !hasRecommendations}
          onApply={(strategy) => void applyRecommendations(strategy)}
        />
      </section>
    </div>
  );
}

function getBuyerLabel(id: string): string {
  const labels: Record<string, string> = {
    "buyer-aylin": "Aylin",
    "buyer-burak": "Burak",
    "buyer-deniz": "Deniz",
    "buyer-emre": "Emre",
  };

  return labels[id] ?? id;
}
