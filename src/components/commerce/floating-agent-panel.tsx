"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowCounterClockwise,
  ArrowRight,
  CheckCircle,
  ClockCounterClockwise,
  LockKey,
  PaperPlaneTilt,
  Robot,
  ShieldCheck,
  ShoppingCart,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ApiEnvelope } from "@/lib/api/responses";
import {
  buyerAgentApplyEndpoint,
  buyerAgentEndpoint,
  type BuyerAgentApiData,
  type BuyerAgentApplyApiData,
  type BuyerAgentApplyStrategy,
} from "@/lib/api/buyer-agent";
import {
  sellerAgentEndpoint,
  type SellerAgentApiData,
} from "@/lib/api/seller-agent";
import {
  createDefaultFloatingAgentStore,
  createFloatingAgentContext,
  floatingAgentUpdatedEvent,
  normalizeFloatingAgentPathname,
  type FloatingAgentStore,
} from "@/lib/agents/floating-agent";
import {
  appendFloatingAgentTurn,
  readFloatingAgentStore,
  toggleFloatingAgentRouteDisabled,
  updateFloatingAgentControl,
} from "@/lib/agents/floating-agent-client";
import { applyBuyerAgentCartMutation } from "@/lib/agents/buyer-cart-apply-client";
import {
  applySellerListingMutation,
  rollbackSellerListingMutation,
} from "@/lib/agents/seller-listing-apply-client";
import type { SellerListingMutationApplyApiData } from "@/lib/agents/seller-listing-apply";

type FloatingRequestState = "idle" | "loading" | "error";
type FloatingApplyState =
  | { status: "applied"; message: string; auditId?: string }
  | { status: "error"; message: string }
  | { status: "idle" }
  | { status: "loading" }
  | { status: "rolled-back"; message: string };

interface FloatingAgentPanelProps {
  role: "buyer" | "seller";
}

export function FloatingAgentPanel({ role }: FloatingAgentPanelProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedPathname = normalizeFloatingAgentPathname(pathname);
  const context = useMemo(
    () => createFloatingAgentContext({ pathname: normalizedPathname, role }),
    [normalizedPathname, role],
  );
  const contextKey = `${role}:${context.pathname}`;
  const [store, setStore] = useState<FloatingAgentStore>(() => createDefaultFloatingAgentStore());
  const [isOpen, setIsOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState({ contextKey: "", value: "" });
  const [requestState, setRequestState] = useState<FloatingRequestState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buyerData, setBuyerData] = useState<BuyerAgentApiData | null>(null);
  const [sellerData, setSellerData] = useState<SellerAgentApiData | null>(null);
  const [applyState, setApplyState] = useState<FloatingApplyState>({ status: "idle" });

  const isMuted = store.control.muted;
  const isPageDisabled = store.control.disabledRoutes.includes(normalizedPathname);
  const shouldShowProactiveCue = !isOpen && !isMuted && !isPageDisabled;
  const history = store.history.filter((turn) => turn.roleScope === role).slice(0, 4);
  const isLoading = requestState === "loading";
  const prompt = promptDraft.contextKey === contextKey ? promptDraft.value : context.defaultPrompt;

  useEffect(() => {
    const syncStore = () => setStore(readFloatingAgentStore());

    syncStore();
    window.addEventListener(floatingAgentUpdatedEvent, syncStore);
    window.addEventListener("storage", syncStore);

    return () => {
      window.removeEventListener(floatingAgentUpdatedEvent, syncStore);
      window.removeEventListener("storage", syncStore);
    };
  }, []);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-floating-agent-reveal]",
        {
          opacity: 0,
          y: 12,
        },
        {
          clearProps: "opacity,transform",
          duration: 0.42,
          ease: "power3.out",
          opacity: 1,
          stagger: 0.04,
          y: 0,
        },
      );
    },
    { dependencies: [isOpen, role, context.pathname], scope: rootRef },
  );

  async function submitPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalizedPrompt = prompt.trim();

    if (!normalizedPrompt) {
      setErrorMessage("Agent'in çalışması için kısa bir komut yaz.");
      setRequestState("error");
      return;
    }

    setRequestState("loading");
    setErrorMessage(null);
    setApplyState({ status: "idle" });
    appendHistoryTurn("user", normalizedPrompt);

    try {
      if (role === "buyer") {
        const response = await fetch(buyerAgentEndpoint, {
          body: JSON.stringify({
            buyerId: context.actorId,
            prompt: normalizedPrompt,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const envelope = (await response.json()) as ApiEnvelope<BuyerAgentApiData>;

        if (!response.ok || !envelope.success) {
          throw new Error(envelope.error?.message ?? "Floating buyer Agent önerisi üretilemedi.");
        }

        setBuyerData(envelope.data);
        setSellerData(null);
        setPromptDraft({ contextKey, value: envelope.data.request.prompt });
        appendHistoryTurn("assistant", `${envelope.data.summary.itemCount} ürün önerdim; onay verirsen sepete uygularım.`);
      } else {
        const response = await fetch(sellerAgentEndpoint, {
          body: JSON.stringify({
            prompt: normalizedPrompt,
            sellerId: context.actorId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const envelope = (await response.json()) as ApiEnvelope<SellerAgentApiData>;

        if (!response.ok || !envelope.success) {
          throw new Error(envelope.error?.message ?? "Floating seller Agent analizi üretilemedi.");
        }

        setSellerData(envelope.data);
        setBuyerData(null);
        setPromptDraft({ contextKey, value: envelope.data.request.prompt });
        appendHistoryTurn("assistant", `${envelope.data.summary.productCount} ürünü sıraladım; taslak onay bekliyor.`);
      }

      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(error instanceof Error ? error.message : "Floating Agent yanıtı üretilemedi.");
    }
  }

  async function applyBuyerSelection(strategy: BuyerAgentApplyStrategy) {
    if (!buyerData) {
      return;
    }

    setApplyState({ status: "loading" });

    try {
      const response = await fetch(buyerAgentApplyEndpoint, {
        body: JSON.stringify({
          actorId: context.actorId,
          items: buyerData.applyPreview.items,
          sourceRuntimeId: context.runtime.runtimeId,
          strategy,
          surface: "floating",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const envelope = (await response.json()) as ApiEnvelope<BuyerAgentApplyApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Sepet mutation uygulanamadı.");
      }

      const result = applyBuyerAgentCartMutation(envelope.data, { surface: "floating" });
      const message = `${result.productCount} ürün, ${result.itemCount} adet olarak sepete uygulandı.`;
      appendHistoryTurn("assistant", message);
      setApplyState({
        message,
        status: "applied",
      });
    } catch (error) {
      setApplyState({
        message: error instanceof Error ? error.message : "Sepet mutation uygulanamadı.",
        status: "error",
      });
    }
  }

  async function applySellerDraft() {
    const draftPreview = sellerData?.draftPreview;

    if (!draftPreview) {
      return;
    }

    setApplyState({ status: "loading" });

    try {
      const response = await fetch(draftPreview.endpoint, {
        body: JSON.stringify({
          ...draftPreview.applyRequest,
          actorId: context.actorId,
          sourceRuntimeId: context.runtime.runtimeId,
          surface: "floating",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const envelope = (await response.json()) as ApiEnvelope<SellerListingMutationApplyApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Listing mutation uygulanamadı.");
      }

      const result = applySellerListingMutation(envelope.data, { surface: "floating" });
      const message = `${result.productName} listing taslağı audit log'a yazıldı.`;
      appendHistoryTurn("assistant", message);
      setApplyState({
        auditId: result.auditId,
        message,
        status: "applied",
      });
    } catch (error) {
      setApplyState({
        message: error instanceof Error ? error.message : "Listing mutation uygulanamadı.",
        status: "error",
      });
    }
  }

  function rollbackSellerDraft() {
    if (applyState.status !== "applied" || !applyState.auditId) {
      return;
    }

    const result = rollbackSellerListingMutation(applyState.auditId);

    if (!result.ok) {
      setApplyState({
        message: result.message,
        status: "error",
      });
      return;
    }

    appendHistoryTurn("assistant", result.message);
    setApplyState({
      message: result.message,
      status: "rolled-back",
    });
  }

  function appendHistoryTurn(turnRole: "assistant" | "user", content: string) {
    const nextStore = appendFloatingAgentTurn({
      content,
      role: turnRole,
      roleScope: role,
      routeContext: normalizedPathname,
    });

    setStore(nextStore);
  }

  function toggleMute() {
    const nextStore = updateFloatingAgentControl((control) => ({
      ...control,
      muted: !control.muted,
    }));

    setStore(nextStore);
  }

  function togglePageWarning() {
    setStore(toggleFloatingAgentRouteDisabled(normalizedPathname));
  }

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4 sm:inset-x-auto sm:right-5 sm:px-0">
      {shouldShowProactiveCue ? (
        <button
          type="button"
          data-floating-agent-reveal
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto mb-3 ml-auto hidden max-w-[360px] rounded-2xl border border-slate-200 bg-white/95 p-4 text-left shadow-[0_24px_70px_-40px_rgba(15,23,42,0.85)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-orange-200 sm:block"
        >
          <span className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
              <Sparkle size={17} weight="duotone" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">{context.panelTitle}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{context.proactiveMessage}</span>
            </span>
          </span>
        </button>
      ) : null}

      {isOpen ? (
        <section
          data-floating-agent-reveal
          aria-label="CommercePilot floating agent"
          className="pointer-events-auto ml-auto max-h-[78dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_90px_-42px_rgba(15,23,42,0.95)] sm:w-[410px]"
        >
          <div className="bg-slate-950 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">{context.routeLabel}</p>
                <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.035em]">{context.panelTitle}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {context.runtime.promptTemplate.label} · {context.runtime.promptTemplate.version}
                </p>
              </div>
              <button
                type="button"
                aria-label="Floating agent panelini gizle"
                onClick={() => setIsOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-slate-200 transition hover:bg-white hover:text-slate-950 active:translate-y-px"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10">
              <FloatingRuntimeMetric label="Tool" value={String(context.runtime.registry.toolCount)} />
              <FloatingRuntimeMetric label="Onay" value={String(context.runtime.registry.approvalRequiredToolCount)} />
              <FloatingRuntimeMetric label="Yüzey" value="floating" />
            </div>
          </div>

          <div className="max-h-[calc(78dvh-168px)] overflow-y-auto p-4">
            <form className="grid gap-3" onSubmit={(event) => void submitPrompt(event)}>
              <label className="grid gap-2" htmlFor={`floating-agent-prompt-${role}`}>
                <span className="text-sm font-semibold text-slate-800">Agent komutu</span>
                <textarea
                  id={`floating-agent-prompt-${role}`}
                  value={prompt}
                  maxLength={role === "buyer" ? 280 : 360}
                  onChange={(event) => setPromptDraft({ contextKey, value: event.target.value })}
                  className="min-h-24 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="commerce-skeleton h-4 w-4 rounded-full bg-white/40" />
                ) : (
                  <PaperPlaneTilt size={17} weight="bold" />
                )}
                {isLoading ? "Çalışıyor" : "Agent'a sor"}
              </button>
            </form>

            {errorMessage ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                <WarningCircle size={17} weight="duotone" className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <FloatingResultPanel
              applyState={applyState}
              buyerData={buyerData}
              onApplyBuyer={(strategy) => void applyBuyerSelection(strategy)}
              onApplySeller={() => void applySellerDraft()}
              onRollbackSeller={rollbackSellerDraft}
              role={role}
              sellerData={sellerData}
            />

            <div className="mt-4 grid gap-2">
              {context.capabilities.map((capability) => (
                <div key={capability.id} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{capability.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{capability.helper}</p>
                  </div>
                  {capability.requiresApproval ? (
                    <LockKey size={17} weight="duotone" className="mt-0.5 shrink-0 text-orange-600" />
                  ) : (
                    <ShieldCheck size={17} weight="duotone" className="mt-0.5 shrink-0 text-emerald-600" />
                  )}
                </div>
              ))}
            </div>

            {history.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <ClockCounterClockwise size={17} weight="duotone" />
                  <p className="text-sm font-semibold">Ortak history</p>
                </div>
                <div className="mt-3 space-y-2">
                  {history.map((turn) => (
                    <div
                      key={turn.id}
                      className={turn.role === "user" ? "ml-auto max-w-[88%] rounded-2xl bg-orange-50 p-3" : "max-w-[92%] rounded-2xl bg-slate-50 p-3"}
                    >
                      <p className="line-clamp-2 text-xs leading-5 text-slate-600">{turn.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-10 rounded-2xl bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 active:translate-y-px"
              >
                Gizle
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className={`min-h-10 rounded-2xl px-3 text-xs font-semibold transition active:translate-y-px ${
                  isMuted ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isMuted ? "Sessiz" : "Sessize al"}
              </button>
              <button
                type="button"
                onClick={togglePageWarning}
                className={`min-h-10 rounded-2xl px-3 text-xs font-semibold transition active:translate-y-px ${
                  isPageDisabled ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                {isPageDisabled ? "Uyarma kapalı" : "Bu sayfada uyarma"}
              </button>
            </div>

            <Link
              href={context.routeAgentHref}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
            >
              Route Agent sayfası
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </section>
      ) : (
        <button
          type="button"
          aria-label="CommercePilot Agent panelini aç"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto ml-auto grid h-16 w-16 place-items-center rounded-[1.35rem] bg-slate-950 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.95)] ring-1 ring-white/20 transition hover:-translate-y-1 hover:bg-slate-900 active:translate-y-0"
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <Robot size={25} weight="duotone" />
            {shouldShowProactiveCue ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                !
              </span>
            ) : null}
          </span>
        </button>
      )}
    </div>
  );
}

function FloatingRuntimeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 p-3 text-center">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function FloatingResultPanel({
  applyState,
  buyerData,
  onApplyBuyer,
  onApplySeller,
  onRollbackSeller,
  role,
  sellerData,
}: {
  applyState: FloatingApplyState;
  buyerData: BuyerAgentApiData | null;
  onApplyBuyer: (strategy: BuyerAgentApplyStrategy) => void;
  onApplySeller: () => void;
  onRollbackSeller: () => void;
  role: "buyer" | "seller";
  sellerData: SellerAgentApiData | null;
}) {
  if (role === "buyer" && buyerData) {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{buyerData.summary.intentLabel}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{buyerData.message.confirmationQuestion}</p>
          </div>
          <ShoppingCart size={19} weight="duotone" className="shrink-0 text-orange-600" />
        </div>
        <div className="mt-3 grid gap-2">
          {buyerData.recommendations.slice(0, 2).map((recommendation) => (
            <div key={recommendation.product.id} className="rounded-2xl bg-slate-50 p-3">
              <p className="line-clamp-1 text-sm font-semibold text-slate-950">{recommendation.product.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{recommendation.primaryReason}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onApplyBuyer("append")}
            disabled={applyState.status === "loading"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 active:translate-y-px disabled:opacity-60"
          >
            <CheckCircle size={15} weight="bold" />
            Sepete ekle
          </button>
          <button
            type="button"
            onClick={() => onApplyBuyer("replace")}
            disabled={applyState.status === "loading"}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px disabled:opacity-60"
          >
            Sepeti değiştir
          </button>
        </div>
        <FloatingApplyNotice applyState={applyState} />
      </div>
    );
  }

  if (role === "seller" && sellerData?.draftPreview) {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{sellerData.message.headline}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{sellerData.draftPreview.productName}</p>
          </div>
          <LockKey size={19} weight="duotone" className="shrink-0 text-orange-600" />
        </div>
        <div className="mt-3 grid gap-2">
          {sellerData.draftPreview.delta.slice(0, 3).map((item) => (
            <div key={item.field} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-orange-700">{item.label}</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{item.after}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onApplySeller}
            disabled={applyState.status === "loading"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-600 active:translate-y-px disabled:opacity-60"
          >
            <CheckCircle size={15} weight="bold" />
            Taslağı uygula
          </button>
          <button
            type="button"
            onClick={onRollbackSeller}
            disabled={applyState.status !== "applied" || !applyState.auditId}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            Geri al
          </button>
        </div>
        <FloatingApplyNotice applyState={applyState} />
      </div>
    );
  }

  return null;
}

function FloatingApplyNotice({ applyState }: { applyState: FloatingApplyState }) {
  if (applyState.status === "idle" || applyState.status === "loading") {
    return applyState.status === "loading" ? (
      <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Onaylı mutation hazırlanıyor.</p>
    ) : null;
  }

  if (applyState.status === "error") {
    return (
      <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
        {applyState.message}
      </p>
    );
  }

  return (
    <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
      {applyState.message}
    </p>
  );
}
