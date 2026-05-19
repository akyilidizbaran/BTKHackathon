"use client";

import { CheckCircle, Robot, WarningCircle } from "@phosphor-icons/react";

export interface LlmStatusMeta {
  fallbackReason?: string;
  generatedAt?: string;
  model: string;
  provider: string;
  status: "generated" | "fallback";
}

interface LlmStatusBadgeProps {
  className?: string;
  density?: "compact" | "regular";
  label?: string;
  meta: LlmStatusMeta;
  showFallbackReason?: boolean;
  tone?: "dark" | "light";
}

export function LlmStatusBadge({
  className = "",
  density = "regular",
  label = "LLM trace",
  meta,
  showFallbackReason = true,
  tone = "light",
}: LlmStatusBadgeProps) {
  const isGenerated = meta.status === "generated";
  const Icon = isGenerated ? CheckCircle : WarningCircle;
  const statusLabel = isGenerated ? "Canlı model" : "Güvenli yanıt";
  const generatedAt = formatGeneratedAt(meta.generatedAt);
  const sizeClass = density === "compact" ? "min-h-7 px-2.5 py-1 text-[11px]" : "min-h-8 px-3 py-1.5 text-xs";
  const neutralChipClass =
    tone === "dark"
      ? "border-white/10 bg-white/[0.06] text-slate-300"
      : "border-slate-200 bg-slate-50 text-slate-600";
  const statusChipClass = isGenerated
    ? tone === "dark"
      ? "border-emerald-200/20 bg-emerald-300/10 text-emerald-100"
      : "border-emerald-200 bg-emerald-50 text-emerald-700"
    : tone === "dark"
      ? "border-amber-200/20 bg-amber-300/10 text-amber-100"
      : "border-amber-200 bg-amber-50 text-amber-700";
  const reasonClass =
    tone === "dark"
      ? "border-amber-200/15 bg-amber-300/[0.045] text-amber-100/80"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClass} ${statusChipClass}`}>
          <Icon size={density === "compact" ? 13 : 15} weight={isGenerated ? "fill" : "duotone"} />
          {statusLabel}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClass} ${neutralChipClass}`}>
          <Robot size={density === "compact" ? 13 : 15} weight="duotone" />
          {label}
        </span>
        <span className={`inline-flex rounded-full border font-mono font-semibold ${sizeClass} ${neutralChipClass}`}>
          Kaynak {formatProvider(meta.provider)}
        </span>
        <span className={`inline-flex max-w-full truncate rounded-full border font-mono font-semibold ${sizeClass} ${neutralChipClass}`}>
          Model {meta.model}
        </span>
        {generatedAt ? (
          <span className={`inline-flex rounded-full border font-mono font-semibold ${sizeClass} ${neutralChipClass}`}>
            {generatedAt}
          </span>
        ) : null}
      </div>

      {showFallbackReason && meta.fallbackReason ? (
        <p className={`mt-2 rounded-lg border px-3 py-2 text-xs leading-5 ${reasonClass}`}>Not: {meta.fallbackReason}</p>
      ) : null}
    </div>
  );
}

function formatProvider(provider: string): string {
  const providers: Record<string, string> = {
    deterministic: "Deterministic",
    gemini: "Gemini",
  };

  return providers[provider] ?? provider;
}

function formatGeneratedAt(generatedAt?: string): string | null {
  if (!generatedAt) {
    return null;
  }

  return generatedAt.replace("T", " ").slice(0, 16);
}
