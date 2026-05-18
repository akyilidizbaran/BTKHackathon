"use client";

import {
  ArrowCounterClockwise,
  CheckCircle,
  ClockCounterClockwise,
  Database,
  LockKey,
} from "@phosphor-icons/react";
import type { SellerAgentDraftPreview } from "@/lib/api/seller-agent";
import type {
  SellerListingMutationApplyClientResult,
  SellerListingMutationAuditEntry,
  SellerListingMutationRollbackResult,
} from "@/lib/agents/seller-listing-apply-client";

export type SellerAgentApplyState =
  | { status: "applied"; result: SellerListingMutationApplyClientResult }
  | { status: "error"; message: string }
  | { status: "idle" }
  | { status: "loading" }
  | { status: "rolled-back"; result: SellerListingMutationRollbackResult };

export function ListingSnapshot({
  label,
  tone,
  values,
}: {
  label: string;
  tone: "dark" | "light";
  values: SellerAgentDraftPreview["beforeListing"];
}) {
  const isDark = tone === "dark";

  return (
    <div className={isDark ? "rounded-lg bg-slate-950 p-4 text-[#fff]" : "rounded-lg bg-slate-50 p-4 text-slate-950"}>
      <p className={isDark ? "text-xs font-semibold text-orange-200" : "text-xs font-semibold text-slate-500"}>{label}</p>
      <p className="mt-3 text-lg font-semibold leading-tight tracking-[-0.03em]">{values.title}</p>
      <p className={isDark ? "mt-3 text-sm leading-6 text-slate-300" : "mt-3 text-sm leading-6 text-slate-600"}>
        {values.description}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ListingField label="Fiyat" value={formatTry(values.price)} dark={isDark} />
        <ListingField label="Kampanya" value={values.campaignLabel} dark={isDark} />
      </div>
    </div>
  );
}

export function ListingMutationApprovalPanel({
  applyState,
  auditEntries,
  draftPreview,
  onApply,
  onRollback,
}: {
  applyState: SellerAgentApplyState;
  auditEntries: SellerListingMutationAuditEntry[];
  draftPreview: SellerAgentDraftPreview;
  onApply: () => void;
  onRollback: (auditId: string) => void;
}) {
  const isApplying = applyState.status === "loading";
  const latestAudit = auditEntries[0];

  return (
    <div className="rounded-lg bg-slate-950 p-4 text-[#fff]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-orange-200">
            <LockKey size={18} weight="duotone" />
            <p className="text-sm font-semibold">{draftPreview.title}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">{draftPreview.approvalCopy}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-200">
          <Database size={19} weight="duotone" />
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
        Taslak satıcı onayı olmadan uygulanmaz. Onay sonrası işlem geçmişine yazılır ve aynı kayıttan geri alınabilir.
      </div>

      <div className="mt-4 grid gap-2">
        {draftPreview.delta.map((item) => (
          <div key={item.field} className="rounded-lg border border-white/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-orange-200">{item.label}</p>
            </div>
            <p className="mt-2 line-clamp-1 text-xs text-slate-500">{item.before}</p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-100">{item.after}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={isApplying}
        onClick={onApply}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-4 text-sm font-semibold text-[#fff] transition hover:bg-orange-400 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isApplying ? (
          <span className="commerce-skeleton h-4 w-4 rounded-full bg-white/40" />
        ) : (
          <CheckCircle size={17} weight="bold" />
        )}
        {isApplying ? "Uygulanıyor" : "Taslağı uygula"}
      </button>

      <ApplyStateNotice applyState={applyState} />

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <ClockCounterClockwise size={18} weight="duotone" />
            <p className="text-sm font-semibold">İşlem geçmişi</p>
          </div>
        </div>

        {auditEntries.length > 0 ? (
          <div className="mt-3 space-y-2">
            {auditEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="rounded-lg bg-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#fff]">{entry.productName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatAuditDate(entry.createdAt)} · {entry.status === "applied" ? "uygulandı" : "geri alındı"}
                    </p>
                  </div>
                  {entry.status === "applied" && entry.rollbackAvailable ? (
                    <button
                      type="button"
                      onClick={() => onRollback(entry.id)}
                      className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-slate-950 transition hover:bg-orange-100 active:translate-y-px"
                    >
                      <ArrowCounterClockwise size={13} weight="bold" />
                      Geri al
                    </button>
                  ) : (
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-slate-400">kapalı</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-white/5 p-3 text-xs leading-5 text-slate-400">
            Henüz uygulanmış listeleme değişikliği yok. İlk onay burada işlem kaydı oluşturacak.
          </p>
        )}

        {latestAudit ? (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Son işlem: {formatAuditDate(latestAudit.createdAt)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ListingField({ dark, label, value }: { dark: boolean; label: string; value: string }) {
  return (
    <div className={dark ? "rounded-lg border border-white/15 bg-slate-900 p-3" : "rounded-lg bg-white p-3"}>
      <p className={dark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>{label}</p>
      <p className={dark ? "mt-1 text-sm font-semibold text-[#fff]" : "mt-1 text-sm font-semibold text-slate-950"}>
        {value}
      </p>
    </div>
  );
}

function ApplyStateNotice({ applyState }: { applyState: SellerAgentApplyState }) {
  if (applyState.status === "applied") {
    return (
      <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-100">
        {applyState.result.message} {applyState.result.fieldCount} alan işlem kaydına yazıldı.
      </div>
    );
  }

  if (applyState.status === "rolled-back") {
    return (
      <div className="mt-3 rounded-lg border border-sky-400/30 bg-sky-400/10 p-3 text-sm leading-6 text-sky-100">
        {applyState.result.message}
      </div>
    );
  }

  if (applyState.status === "error") {
    return (
      <div className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
        {applyState.message}
      </div>
    );
  }

  return null;
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatAuditDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}
