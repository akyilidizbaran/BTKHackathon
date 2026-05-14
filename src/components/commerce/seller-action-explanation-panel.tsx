"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { SellerActionExplanationApiData } from "@/lib/api/seller-action-explanations";

type ExplanationState =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "ready"; data: SellerActionExplanationApiData; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

interface ApiEnvelope<TData> {
  success: boolean;
  data: TData | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export function SellerActionExplanationPanel({ actionId }: { actionId: string }) {
  const [state, setState] = useState<ExplanationState>({ status: "loading" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadExplanation() {
      setState({ status: "loading" });

      try {
        const response = await fetch(`/api/seller/actions/${actionId}/explanation`, {
          cache: "no-store",
        });
        const envelope = (await response.json()) as ApiEnvelope<SellerActionExplanationApiData>;

        if (!response.ok || !envelope.success || !envelope.data) {
          throw new Error(envelope.error?.message ?? "Model açıklaması alınamadı.");
        }

        if (isActive) {
          setState({ data: envelope.data, status: "ready" });
        }
      } catch (error) {
        if (isActive) {
          setState({
            error: error instanceof Error ? error.message : "Model açıklaması alınamadı.",
            status: "error",
          });
        }
      }
    }

    loadExplanation();

    return () => {
      isActive = false;
    };
  }, [actionId, retryKey]);

  if (state.status === "loading") {
    return (
      <PanelShell>
        <PanelHeader
          eyebrow="OpenAI açıklaması"
          helper="gpt-4o-mini ile runtime açıklama üretiliyor."
          title="Model açıklaması"
        />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-24 animate-pulse rounded-2xl bg-white/[0.055]" />
        </div>
      </PanelShell>
    );
  }

  if (state.status === "error") {
    return (
      <PanelShell>
        <PanelHeader
          eyebrow="OpenAI açıklaması"
          helper="Endpoint hata döndürdü; deterministic seller action ekranı etkilenmez."
          title="Model açıklaması alınamadı"
        />
        <p className="mt-5 text-sm leading-6 text-zinc-500">{state.error}</p>
        <button
          className="mt-5 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white transition hover:border-emerald-200/40 hover:text-emerald-100"
          type="button"
          onClick={() => setRetryKey((key) => key + 1)}
        >
          Tekrar dene
        </button>
      </PanelShell>
    );
  }

  const { explanation } = state.data;
  const isGenerated = explanation.status === "generated";

  return (
    <PanelShell>
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
        <PanelHeader
          eyebrow="OpenAI açıklaması"
          helper={isGenerated ? "Canlı model çıktısı" : "Deterministik fallback çıktı"}
          title={explanation.headline}
        />
        <span
          className={
            isGenerated
              ? "rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 font-mono text-xs text-emerald-100"
              : "rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 font-mono text-xs text-amber-100"
          }
        >
          {explanation.provider} · {explanation.model}
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-zinc-400">{explanation.summary}</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/45 p-4">
        <p className="text-sm font-medium text-white">Kanıt özeti</p>
        <div className="mt-3 divide-y divide-white/10">
          {explanation.evidenceBullets.map((item) => (
            <p key={item} className="py-3 text-sm leading-6 text-zinc-500">
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs text-zinc-600">Sıradaki iş</p>
          <p className="mt-2 text-sm leading-6 text-white">{explanation.nextBestAction}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-600">Mesaj taslağı</p>
          <p className="mt-2 text-sm leading-6 text-white">{explanation.sellerMessageDraft}</p>
        </div>
      </div>

      {explanation.fallbackReason ? (
        <p className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-300/[0.045] p-3 text-xs leading-5 text-amber-100/80">
          {explanation.fallbackReason}
        </p>
      ) : null}
    </PanelShell>
  );
}

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
      {children}
    </div>
  );
}

function PanelHeader({
  eyebrow,
  helper,
  title,
}: {
  eyebrow: string;
  helper: string;
  title: string;
}) {
  return (
    <div>
      <p className="font-mono text-xs text-emerald-200/70">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{helper}</p>
    </div>
  );
}
