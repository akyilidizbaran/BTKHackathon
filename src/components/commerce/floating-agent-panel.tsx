"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  PaperPlaneTilt,
  Robot,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ApiEnvelope } from "@/lib/api/responses";
import {
  buyerAgentApplyEndpoint,
  type BuyerAgentApiData,
  type BuyerAgentApplyApiData,
  type BuyerAgentApplyStrategy,
} from "@/lib/api/buyer-agent";
import type { SellerAgentApiData } from "@/lib/api/seller-agent";
import {
  floatingAgentEndpoint,
  type FloatingAgentApiData,
} from "@/lib/api/floating-agent";
import {
  createDefaultFloatingAgentStore,
  createFloatingAgentContext,
  floatingAgentUpdatedEvent,
  normalizeFloatingAgentPathname,
  type FloatingAgentStore,
} from "@/lib/agents/floating-agent";
import {
  readFloatingAgentStore,
  toggleFloatingAgentRouteDisabled,
  updateFloatingAgentControl,
} from "@/lib/agents/floating-agent-client";
import {
  buyerProfileUpdatedEvent,
  readBuyerProfileDraft,
} from "@/lib/profile/buyer-profile-storage";
import type { BuyerProfileEditableState } from "@/lib/api/buyer-profile";
import { applyBuyerAgentCartMutation } from "@/lib/agents/buyer-cart-apply-client";
import {
  applySellerListingMutation,
  rollbackSellerListingMutation,
} from "@/lib/agents/seller-listing-apply-client";
import type { SellerListingMutationApplyApiData } from "@/lib/agents/seller-listing-apply";
import {
  FloatingResultPanel,
  type FloatingApplyState,
} from "@/components/commerce/floating-agent-result-panel";

type FloatingRequestState = "idle" | "loading" | "error";
type FloatingSessionTurn = {
  content: string;
  id: string;
  role: "assistant" | "user";
};

interface FloatingAgentPanelProps {
  role: "buyer" | "seller";
}

function isDenseFloatingSurface(role: FloatingAgentPanelProps["role"], pathname: string): boolean {
  if (role === "seller") {
    return true;
  }

  return (
    pathname === "/buyer" ||
    pathname === "/buyer/products" ||
    pathname.startsWith("/buyer/products/") ||
    pathname === "/buyer/cart" ||
    pathname === "/buyer/agent" ||
    pathname === "/buyer/profile"
  );
}

export function FloatingAgentPanel({ role }: FloatingAgentPanelProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedPathname = normalizeFloatingAgentPathname(pathname);
  const [buyerProfileDraft, setBuyerProfileDraft] = useState<BuyerProfileEditableState | undefined>();
  const context = useMemo(
    () => createFloatingAgentContext({ buyerProfileOverride: buyerProfileDraft, pathname: normalizedPathname, role }),
    [buyerProfileDraft, normalizedPathname, role],
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
  const [sessionTurns, setSessionTurns] = useState<FloatingSessionTurn[]>([]);

  const isMuted = store.control.muted;
  const isPageDisabled = store.control.disabledRoutes.includes(normalizedPathname);
  const isDenseSurface = isDenseFloatingSurface(role, normalizedPathname);
  const shouldShowProactiveCue = !isOpen && !isMuted && !isPageDisabled;
  const isProfileWarning = context.proactiveTone === "warning";
  const shouldShowCompactWarning = shouldShowProactiveCue && isProfileWarning;
  const shouldShowExpandedCue = shouldShowProactiveCue && !isDenseSurface && !isProfileWarning;
  const shouldShowIconBadge = shouldShowProactiveCue && (isProfileWarning || !isDenseSurface);
  const shouldUseSideDock =
    !isOpen &&
    (role === "seller" ||
      normalizedPathname.startsWith("/buyer/products/") ||
      normalizedPathname === "/buyer/agent" ||
      normalizedPathname === "/buyer/profile");
  const dockPositionClass = isOpen
    ? "bottom-4"
    : shouldUseSideDock
      ? "bottom-4 sm:bottom-auto sm:top-[58dvh] sm:-translate-y-1/2"
      : shouldShowCompactWarning
        ? "bottom-24"
        : "bottom-4";
  const history = sessionTurns.slice(-6);
  const isLoading = requestState === "loading";
  const prompt = promptDraft.contextKey === contextKey ? promptDraft.value : "";

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

  useEffect(() => {
    if (role !== "buyer") {
      return;
    }

    const syncBuyerProfileDraft = () => setBuyerProfileDraft(readBuyerProfileDraft("buyer-aylin"));

    syncBuyerProfileDraft();
    window.addEventListener(buyerProfileUpdatedEvent, syncBuyerProfileDraft);
    window.addEventListener("storage", syncBuyerProfileDraft);

    return () => {
      window.removeEventListener(buyerProfileUpdatedEvent, syncBuyerProfileDraft);
      window.removeEventListener("storage", syncBuyerProfileDraft);
    };
  }, [role]);

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
    setBuyerData(null);
    setSellerData(null);
    appendSessionTurn("user", normalizedPrompt);

    try {
      const response = await fetch(floatingAgentEndpoint, {
        body: JSON.stringify({
          actorId: context.actorId,
          history: [],
          pathname: context.pathname,
          prompt: normalizedPrompt,
          role,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const envelope = (await response.json()) as ApiEnvelope<FloatingAgentApiData>;

      if (!response.ok || !envelope.success) {
        throw new Error(envelope.error?.message ?? "Floating Agent yanıtı üretilemedi.");
      }

      setBuyerData(envelope.data.buyerAgent ?? null);
      setSellerData(envelope.data.sellerAgent ?? null);
      setPromptDraft({ contextKey, value: "" });
      appendSessionTurn("assistant", envelope.data.message.content);
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
        throw new Error(envelope.error?.message ?? "Sepet işlemi uygulanamadı.");
      }

      const result = applyBuyerAgentCartMutation(envelope.data, { surface: "floating" });
      const message = `${result.productCount} ürün, ${result.itemCount} adet olarak sepete uygulandı.`;
      appendSessionTurn("assistant", message);
      setApplyState({
        message,
        status: "applied",
      });
    } catch (error) {
      setApplyState({
        message: error instanceof Error ? error.message : "Sepet işlemi uygulanamadı.",
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
        throw new Error(envelope.error?.message ?? "Listeleme değişikliği uygulanamadı.");
      }

      const result = applySellerListingMutation(envelope.data, { surface: "floating" });
      const message = `${result.productName} listeleme taslağı işlem geçmişine yazıldı.`;
      appendSessionTurn("assistant", message);
      setApplyState({
        auditId: result.auditId,
        message,
        status: "applied",
      });
    } catch (error) {
      setApplyState({
        message: error instanceof Error ? error.message : "Listeleme değişikliği uygulanamadı.",
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

    appendSessionTurn("assistant", result.message);
    setApplyState({
      message: result.message,
      status: "rolled-back",
    });
  }

  function appendSessionTurn(turnRole: "assistant" | "user", content: string) {
    const nextTurn: FloatingSessionTurn = {
      content,
      id: `floating.session.${Date.now()}.${Math.round(Math.random() * 1000)}`,
      role: turnRole,
    };

    setSessionTurns((currentTurns) => [...currentTurns, nextTurn].slice(-8));
  }

  function resetConversationState() {
    setPromptDraft({ contextKey, value: "" });
    setRequestState("idle");
    setErrorMessage(null);
    setBuyerData(null);
    setSellerData(null);
    setApplyState({ status: "idle" });
    setSessionTurns([]);
  }

  function openFreshSession() {
    resetConversationState();
    setIsOpen(true);
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
    <div
      ref={rootRef}
      className={`pointer-events-none fixed inset-x-0 z-50 px-4 sm:inset-x-auto sm:right-5 sm:px-0 ${dockPositionClass}`}
    >
      {shouldShowExpandedCue ? (
        <button
          type="button"
          data-floating-agent-reveal
          onClick={openFreshSession}
          className={`pointer-events-auto mb-3 ml-auto hidden max-w-[360px] rounded-2xl border bg-white/95 p-4 text-left shadow-[0_24px_70px_-40px_rgba(15,23,42,0.85)] backdrop-blur-xl transition hover:-translate-y-0.5 sm:block ${
            isProfileWarning ? "border-amber-300 hover:border-amber-400" : "border-slate-200 hover:border-orange-200"
          }`}
        >
          <span className="flex items-start gap-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white ${isProfileWarning ? "bg-amber-500" : "bg-slate-950"}`}>
              {isProfileWarning ? <WarningCircle size={18} weight="duotone" /> : <Sparkle size={17} weight="duotone" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">{context.panelTitle}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{context.proactiveMessage}</span>
            </span>
          </span>
        </button>
      ) : null}

      {shouldShowCompactWarning ? (
        <button
          type="button"
          data-floating-agent-reveal
          onClick={openFreshSession}
          className="pointer-events-auto mb-2 ml-auto flex max-w-[232px] items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-3 py-2 text-left shadow-[0_18px_44px_-30px_rgba(15,23,42,0.88)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-amber-300"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-500 text-white">
            <WarningCircle size={15} weight="duotone" />
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-slate-800">Profil uyarısı</span>
        </button>
      ) : null}

      {isOpen ? (
        <section
          data-floating-agent-reveal
          aria-label="Alışveriş Arkadaşım floating agent"
          className="pointer-events-auto ml-auto max-h-[76dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_90px_-42px_rgba(15,23,42,0.95)] sm:w-[410px]"
        >
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-orange-600">{context.routeLabel}</p>
                <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">Alışveriş Arkadaşım Agent</h2>
                <p className="mt-2 text-xs leading-5 text-slate-500">{context.panelTitle}</p>
              </div>
              <button
                type="button"
                aria-label="Floating agent panelini gizle"
                onClick={() => setIsOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-950 hover:text-white active:translate-y-px"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(76dvh-96px)] overflow-y-auto p-4">
            {history.length > 0 ? (
              <div className="mb-4 space-y-2">
                {history.map((turn) => (
                  <div
                    key={turn.id}
                    className={turn.role === "user" ? "ml-auto max-w-[86%] rounded-2xl bg-orange-50 p-3" : "max-w-[90%] rounded-2xl bg-slate-50 p-3"}
                  >
                    <p className="line-clamp-3 text-xs leading-5 text-slate-600">{turn.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-950">{isProfileWarning ? context.panelTitle : "Nasıl yardımcı olayım?"}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{context.proactiveMessage}</p>
              </div>
            )}

            <form className="grid gap-3" onSubmit={(event) => void submitPrompt(event)}>
              <label className="grid gap-2" htmlFor={`floating-agent-prompt-${role}`}>
                <span className="text-sm font-semibold text-slate-800">Mesajın</span>
                <textarea
                  id={`floating-agent-prompt-${role}`}
                  value={prompt}
                  maxLength={role === "buyer" ? 280 : 360}
                  onChange={(event) => setPromptDraft({ contextKey, value: event.target.value })}
                  placeholder={context.defaultPrompt}
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
          </div>
        </section>
      ) : shouldShowCompactWarning ? null : (
        <button
          type="button"
          aria-label="Alışveriş Arkadaşım Agent panelini aç"
          onClick={openFreshSession}
          className="pointer-events-auto ml-auto grid h-16 w-16 place-items-center rounded-[1.35rem] bg-slate-950 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.95)] ring-1 ring-white/20 transition hover:-translate-y-1 hover:bg-slate-900 active:translate-y-0"
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <Robot size={25} weight="duotone" />
            {shouldShowIconBadge ? (
              <span className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white ${isProfileWarning ? "bg-amber-500" : "bg-orange-500"}`}>
                !
              </span>
            ) : null}
          </span>
        </button>
      )}
    </div>
  );
}
