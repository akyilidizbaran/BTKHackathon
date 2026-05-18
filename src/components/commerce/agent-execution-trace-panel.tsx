"use client";

import {
  CheckCircle,
  ClockCounterClockwise,
  Database,
  LockKey,
  Robot,
  ShieldCheck,
  Sparkle,
  Stack,
} from "@phosphor-icons/react";
import type {
  AgentExecutionTrace,
  AgentTraceItem,
  AgentTraceLayer,
  AgentTraceStatus,
} from "@/lib/agents/runtime";

interface AgentExecutionTracePanelProps {
  className?: string;
  density?: "comfortable" | "compact";
  description?: string;
  title?: string;
  trace: AgentExecutionTrace;
  variant?: "dark" | "demo" | "floating" | "light";
}

const traceLayers: AgentTraceLayer[] = ["context", "workflow", "llm", "guardrail", "approval", "tool"];

const layerLabels: Record<AgentTraceLayer, string> = {
  approval: "Onay",
  context: "Veri",
  guardrail: "Sınır",
  llm: "Öneri",
  tool: "Araç",
  workflow: "Akış",
};

const statusLabels: Record<AgentTraceStatus, string> = {
  completed: "Tamamlandı",
  guarded: "Korumalı",
  pending: "Bekliyor",
  ready: "Hazır",
};

const statusIcons = {
  completed: CheckCircle,
  guarded: ShieldCheck,
  pending: ClockCounterClockwise,
  ready: Sparkle,
} satisfies Record<AgentTraceStatus, typeof CheckCircle>;

const layerIcons = {
  approval: LockKey,
  context: Database,
  guardrail: ShieldCheck,
  llm: Robot,
  tool: Stack,
  workflow: Sparkle,
} satisfies Record<AgentTraceLayer, typeof CheckCircle>;

export function AgentExecutionTracePanel({
  className,
  density = "comfortable",
  description,
  title = "Agent işlem izi",
  trace,
  variant = "light",
}: AgentExecutionTracePanelProps) {
  const isDark = variant === "dark";
  const isFloating = variant === "floating";
  const compact = density === "compact";
  const toolItems = trace.items.filter((item) => item.toolId || item.endpoint);

  return (
    <aside
      data-agent-trace-panel
      className={cn(
        "overflow-hidden rounded-lg border shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]",
        isDark
          ? "border-white/10 bg-slate-950 text-white"
          : variant === "demo"
            ? "border-slate-200 bg-white text-slate-950 shadow-[0_28px_86px_-70px_rgba(15,23,42,0.9)]"
            : "border-slate-200 bg-white text-slate-950",
        isFloating && "rounded-2xl shadow-none",
        className,
      )}
    >
      <div className={cn(compact ? "p-4" : "p-5 md:p-6")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  isDark ? "bg-white/10 text-orange-200" : "bg-orange-50 text-orange-700",
                )}
              >
                <Robot size={18} weight="duotone" />
              </span>
              <div className="min-w-0">
                <h2 className={cn("font-semibold leading-tight", compact ? "text-base" : "text-xl")}>{title}</h2>
                {!compact ? (
                  <p className={cn("mt-1 truncate font-mono text-[11px]", isDark ? "text-slate-500" : "text-slate-500")}>
                    {trace.id}
                  </p>
                ) : null}
              </div>
            </div>
            <p className={cn("mt-4 leading-6", compact ? "text-xs" : "text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
              {description ?? trace.summary}
            </p>
          </div>

          {!compact ? <div className="hidden shrink-0 text-right sm:block">
            <p className={cn("text-[11px] font-semibold", isDark ? "text-orange-200" : "text-orange-700")}>
              {trace.role} / {trace.surface}
            </p>
            <p className={cn("mt-1 font-mono text-[11px]", isDark ? "text-slate-500" : "text-slate-500")}>{trace.generatedAt}</p>
          </div> : null}
        </div>

        <div
          className={cn(
            "mt-5 grid grid-flow-dense gap-2",
            compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
          )}
        >
          {traceLayers.map((layer) => {
            const covered = trace.coverage[layer];
            const Icon = layerIcons[layer];

            return (
              <div
                key={layer}
                className={cn(
                  "min-h-20 rounded-lg border p-3",
                  covered
                    ? isDark
                      ? "border-white/10 bg-white/[0.06]"
                      : "border-orange-100 bg-orange-50/70"
                    : isDark
                      ? "border-white/10 bg-white/[0.03] opacity-55"
                      : "border-slate-200 bg-slate-50 opacity-60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon
                    size={16}
                    weight="duotone"
                    className={covered ? (isDark ? "text-orange-200" : "text-orange-700") : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      covered ? (isDark ? "bg-orange-300" : "bg-orange-500") : "bg-slate-300",
                    )}
                  />
                </div>
                <p className={cn("mt-3 text-xs font-semibold", isDark ? "text-white" : "text-slate-950")}>{layerLabels[layer]}</p>
                <p className={cn("mt-1 text-[11px]", isDark ? "text-slate-500" : "text-slate-500")}>
                  {covered ? "Kullanıldı" : "Yok"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 space-y-2">
          {trace.items.map((item) => (
            <TraceStep key={item.id} isDark={isDark} item={item} />
          ))}
        </div>

        {toolItems.length > 0 ? (
          <div
            className={cn(
              "mt-5 rounded-lg border p-4",
              isDark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex items-center gap-2">
              <LockKey size={17} weight="duotone" className={isDark ? "text-orange-200" : "text-orange-700"} />
              <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-950")}>
                Onay ve araç sınırı
              </p>
            </div>
            <div className="mt-3 grid gap-2">
              {toolItems.map((item) => (
                <div key={`${item.id}-tool`} className={cn("rounded-lg p-3", isDark ? "bg-slate-900" : "bg-white")}>
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("text-xs font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>{item.label}</p>
                    {item.requiresApproval ? (
                      <span className={cn("shrink-0 text-[11px] font-semibold", isDark ? "text-orange-200" : "text-orange-700")}>
                        onay gerekli
                      </span>
                    ) : null}
                  </div>
                  {!compact && item.toolId ? (
                    <p className={cn("mt-2 break-words font-mono text-[11px]", isDark ? "text-slate-500" : "text-slate-500")}>
                      {item.toolId}
                    </p>
                  ) : null}
                  {!compact && item.endpoint ? (
                    <p className={cn("mt-1 break-words font-mono text-[11px]", isDark ? "text-slate-500" : "text-slate-500")}>
                      {item.endpoint}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function TraceStep({ isDark, item }: { isDark: boolean; item: AgentTraceItem }) {
  const StatusIcon = statusIcons[item.status];

  return (
    <div className={cn("grid gap-3 rounded-lg border p-3", isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold",
              isDark ? "bg-white/10 text-orange-200" : "bg-white text-slate-700 ring-1 ring-slate-200",
            )}
          >
            {item.order}
          </span>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-slate-950")}>{item.label}</p>
            <p className={cn("mt-1 text-xs leading-5", isDark ? "text-slate-400" : "text-slate-600")}>{item.detail}</p>
          </div>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold", isDark ? "text-slate-300" : "text-slate-600")}>
          <StatusIcon size={14} weight="duotone" />
          {statusLabels[item.status]}
        </span>
      </div>
    </div>
  );
}

function cn(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
