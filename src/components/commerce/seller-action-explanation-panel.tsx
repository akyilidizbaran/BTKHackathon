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
          eyebrow="Kısa özet"
          helper="Yorumlardan çıkan aksiyon hazırlanıyor."
          title="Özet hazırlanıyor"
        />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </PanelShell>
    );
  }

  if (state.status === "error") {
    return (
      <PanelShell>
        <PanelHeader
          eyebrow="Kısa özet"
          helper="Bu panel yüklenemedi; aksiyon detayı kullanılmaya devam eder."
          title="Özet alınamadı"
        />
        <p className="mt-5 text-sm leading-6 text-slate-500">{state.error}</p>
        <button
          className="mt-5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700"
          type="button"
          onClick={() => setRetryKey((key) => key + 1)}
        >
          Tekrar dene
        </button>
      </PanelShell>
    );
  }

  const { explanation } = state.data;

  return (
    <PanelShell>
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <PanelHeader
          eyebrow="Kısa özet"
          helper="Satıcının göreceği kadar kısa tutulur."
          title="Bu aksiyon ne yapacak?"
        />
      </div>

      <p className="mt-5 line-clamp-3 text-sm leading-7 text-slate-600">{explanation.summary}</p>

      <div className="mt-5 grid gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">Sıradaki iş</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-950">{explanation.nextBestAction}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">Mesaj taslağı</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-950">{explanation.sellerMessageDraft}</p>
        </div>
      </div>
    </PanelShell>
  );
}

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7">
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
      <p className="font-mono text-xs font-semibold text-orange-600">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}
