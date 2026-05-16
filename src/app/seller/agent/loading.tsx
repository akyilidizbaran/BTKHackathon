export default function SellerAgentLoading() {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] xl:col-span-8 md:p-7">
          <div className="commerce-skeleton h-16 max-w-4xl rounded-full bg-slate-100" />
          <div className="commerce-skeleton mt-5 h-4 max-w-2xl rounded-full bg-slate-100" />
          <div className="commerce-skeleton mt-8 h-32 rounded-lg bg-slate-100" />
          <div className="commerce-skeleton mt-5 h-12 w-40 rounded-full bg-slate-100" />
        </div>
        <div className="rounded-lg bg-slate-950 p-5 xl:col-span-4">
          <div className="commerce-skeleton h-7 w-44 rounded-full bg-white/10" />
          <div className="mt-6 grid grid-cols-2 gap-px">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="commerce-skeleton h-16 rounded-lg bg-white/10" />
            ))}
          </div>
          <div className="commerce-skeleton mt-5 h-28 rounded-lg bg-white/10" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-3">
          <div className="commerce-skeleton h-7 w-36 rounded-full bg-slate-100" />
          <div className="commerce-skeleton mt-5 h-32 rounded-lg bg-slate-100" />
        </div>
        <div className="space-y-3 xl:col-span-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="grid gap-5 lg:grid-cols-[112px_minmax(0,1fr)_128px] lg:items-center">
                <div className="commerce-skeleton aspect-[4/3] rounded-lg bg-slate-100" />
                <div>
                  <div className="commerce-skeleton h-5 w-3/4 rounded-full bg-slate-100" />
                  <div className="commerce-skeleton mt-4 h-4 w-full rounded-full bg-slate-100" />
                  <div className="commerce-skeleton mt-3 h-4 w-4/5 rounded-full bg-slate-100" />
                </div>
                <div className="commerce-skeleton h-10 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-3">
          <div className="commerce-skeleton h-7 w-36 rounded-full bg-slate-100" />
          <div className="commerce-skeleton mt-5 h-52 rounded-lg bg-slate-100" />
        </div>
      </section>
    </div>
  );
}
