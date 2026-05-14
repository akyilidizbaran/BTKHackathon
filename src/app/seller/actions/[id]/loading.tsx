export default function SellerActionDetailLoading() {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="commerce-skeleton h-4 w-36 rounded-full bg-white/10" />
          <div className="commerce-skeleton mt-6 h-24 max-w-4xl rounded-3xl bg-white/10" />
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-zinc-950/55 p-4">
                <div className="commerce-skeleton h-3 w-20 rounded-full bg-white/10" />
                <div className="commerce-skeleton mt-3 h-6 w-24 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="commerce-skeleton h-4 w-28 rounded-full bg-white/10" />
          <div className="commerce-skeleton mt-5 h-28 rounded-2xl bg-white/10" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-t border-white/10 pt-4">
                <div className="commerce-skeleton h-5 w-full rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="commerce-skeleton h-7 w-64 rounded-full bg-white/10" />
          <div className="mt-6 divide-y divide-white/10">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="py-5">
                <div className="commerce-skeleton h-5 w-3/5 rounded-full bg-white/10" />
                <div className="commerce-skeleton mt-3 h-4 w-4/5 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="commerce-skeleton h-7 w-44 rounded-full bg-white/10" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border-t border-white/10 pt-4">
                <div className="commerce-skeleton h-5 w-full rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
