import Link from "next/link";

export default function BuyerCartPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Sepet</p>
        <div className="mt-10 grid min-h-[360px] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Sepetin şu an boş.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ürünlerden seçim yapabilir veya Agent’a bütçe ve stil söyleyerek sepeti başlatabilirsin.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/buyer/products"
                className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px"
              >
                Ürünlere git
              </Link>
              <Link
                href="/buyer/agent"
                className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 active:translate-y-px"
              >
                Agent ile sepet kur
              </Link>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Sepet özeti</h3>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500">Ürün</span>
              <span className="font-semibold text-slate-950">0</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500">Ara toplam</span>
              <span className="font-semibold text-slate-950">0 TL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Toplam</span>
              <span className="text-xl font-semibold tracking-[-0.04em] text-slate-950">0 TL</span>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="mt-5 min-h-11 w-full rounded-full bg-slate-200 px-5 text-sm font-semibold text-slate-500"
          >
            Ödemeye Geç
          </button>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-orange-700">Agent önerisi</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            &quot;3000 TL altı sade bir çalışma seti kur&quot; diyerek sepeti boş halden başlatabilirsin.
          </p>
        </div>
      </aside>
    </div>
  );
}
