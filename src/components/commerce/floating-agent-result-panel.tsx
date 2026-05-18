"use client";

import {
  ArrowCounterClockwise,
  CheckCircle,
  LockKey,
  ShoppingCart,
} from "@phosphor-icons/react";
import type {
  BuyerAgentApiData,
  BuyerAgentApplyStrategy,
} from "@/lib/api/buyer-agent";
import type { SellerAgentApiData } from "@/lib/api/seller-agent";

export type FloatingApplyState =
  | { status: "applied"; message: string; auditId?: string }
  | { status: "error"; message: string }
  | { status: "idle" }
  | { status: "loading" }
  | { status: "rolled-back"; message: string };

interface FloatingResultPanelProps {
  applyState: FloatingApplyState;
  buyerData: BuyerAgentApiData | null;
  onApplyBuyer: (strategy: BuyerAgentApplyStrategy) => void;
  onApplySeller: () => void;
  onRollbackSeller: () => void;
  role: "buyer" | "seller";
  sellerData: SellerAgentApiData | null;
}

export function FloatingResultPanel({
  applyState,
  buyerData,
  onApplyBuyer,
  onApplySeller,
  onRollbackSeller,
  role,
  sellerData,
}: FloatingResultPanelProps) {
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
      <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Onaylı işlem hazırlanıyor.</p>
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
