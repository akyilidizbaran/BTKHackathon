import Link from "next/link";
import {
  ArrowRight,
  BracketsCurly,
  FlowArrow,
  LockKey,
  ShieldCheck,
} from "@phosphor-icons/react";
import {
  sharedAgentRuntimeEndpoint,
  type AgentRuntimeSnapshot,
} from "@/lib/agents/runtime";

interface AgentRuntimePanelProps {
  runtime: AgentRuntimeSnapshot;
  variant?: "dark" | "light";
}

export function AgentRuntimePanel({ runtime, variant = "light" }: AgentRuntimePanelProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={
        isDark
          ? "rounded-lg border border-white/10 bg-white/5 p-4 text-[#fff]"
          : "rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={isDark ? "text-xl font-semibold tracking-[-0.03em] text-[#fff]" : "text-xl font-semibold tracking-[-0.03em] text-slate-950"}>
            Ortak runtime
          </h2>
          <p className={isDark ? "mt-1 text-sm leading-6 text-slate-400" : "mt-1 text-sm leading-6 text-slate-500"}>
            {runtime.promptTemplate.label} · {runtime.promptTemplate.version}
          </p>
        </div>
        <span className={isDark ? "grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-orange-200" : "grid h-10 w-10 place-items-center rounded-lg bg-orange-50 text-orange-700"}>
          <FlowArrow size={19} weight="duotone" />
        </span>
      </div>

      <div className={isDark ? "mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/10" : "mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-slate-200"}>
        <RuntimeMetric label="Prompt" value={String(runtime.registry.promptTemplateCount)} variant={variant} />
        <RuntimeMetric label="Tool" value={String(runtime.registry.toolCount)} variant={variant} />
        <RuntimeMetric label="Onay" value={String(runtime.registry.approvalRequiredToolCount)} variant={variant} />
      </div>

      <div className={isDark ? "mt-5 divide-y divide-white/10 border-y border-white/10" : "mt-5 divide-y divide-slate-200 border-y border-slate-200"}>
        {runtime.toolPlan.slice(0, 4).map((tool) => (
          <div key={tool.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className={isDark ? "truncate text-sm font-semibold text-[#fff]" : "truncate text-sm font-semibold text-slate-950"}>
                {tool.label}
              </p>
              <p className={isDark ? "mt-1 font-mono text-xs text-slate-500" : "mt-1 font-mono text-xs text-slate-400"}>
                {tool.method} {tool.endpoint}
              </p>
            </div>
            {tool.requiresApproval ? (
              <LockKey className="mt-0.5 shrink-0 text-orange-500" size={17} weight="duotone" />
            ) : (
              <ShieldCheck className={isDark ? "mt-0.5 shrink-0 text-emerald-300" : "mt-0.5 shrink-0 text-emerald-600"} size={17} weight="duotone" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {runtime.guardrails.slice(0, 2).map((guardrail) => (
          <p key={guardrail} className={isDark ? "text-xs leading-5 text-slate-400" : "text-xs leading-5 text-slate-500"}>
            {guardrail}
          </p>
        ))}
      </div>

      <Link
        href={sharedAgentRuntimeEndpoint}
        className={
          isDark
            ? "mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 active:translate-y-px"
            : "mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
        }
      >
        <BracketsCurly size={15} weight="bold" />
        Registry JSON
        <ArrowRight size={15} weight="bold" />
      </Link>
    </section>
  );
}

function RuntimeMetric({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "dark" | "light";
}) {
  const isDark = variant === "dark";

  return (
    <div className={isDark ? "bg-slate-900 p-3 text-center" : "bg-white p-3 text-center"}>
      <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>{label}</p>
      <p className={isDark ? "mt-1 font-mono text-sm font-semibold text-[#fff]" : "mt-1 font-mono text-sm font-semibold text-slate-950"}>
        {value}
      </p>
    </div>
  );
}
