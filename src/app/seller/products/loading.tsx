export default function SellerProductsLoading() {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)] md:p-7">
          <div className="commerce-skeleton h-12 max-w-3xl rounded-full bg-slate-100" />
          <div className="commerce-skeleton mt-5 h-4 max-w-2xl rounded-full bg-slate-100" />
          <div className="mt-7 flex gap-3">
            <div className="commerce-skeleton h-11 w-36 rounded-full bg-slate-100" />
            <div className="commerce-skeleton h-11 w-32 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="rounded-lg bg-slate-950 p-5">
          <div className="commerce-skeleton h-7 w-44 rounded-full bg-white/10" />
          <div className="commerce-skeleton mt-5 aspect-[4/3] rounded-lg bg-white/10" />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="commerce-skeleton h-11 w-32 shrink-0 rounded-full bg-slate-100" />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="grid gap-4 lg:grid-cols-[104px_minmax(0,1fr)_120px_120px_124px_132px] lg:items-center">
                <div className="commerce-skeleton aspect-[4/3] rounded-lg bg-slate-100" />
                <div>
                  <div className="commerce-skeleton h-4 w-3/5 rounded-full bg-slate-100" />
                  <div className="commerce-skeleton mt-3 h-4 w-4/5 rounded-full bg-slate-100" />
                </div>
                {Array.from({ length: 4 }).map((_, metricIndex) => (
                  <div key={metricIndex} className="commerce-skeleton h-8 rounded-full bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="commerce-skeleton aspect-[4/3] rounded-lg bg-slate-100" />
          <div className="commerce-skeleton mt-5 h-7 w-3/4 rounded-full bg-slate-100" />
          <div className="commerce-skeleton mt-4 h-24 rounded-lg bg-slate-100" />
        </div>
      </section>
    </div>
  );
}
