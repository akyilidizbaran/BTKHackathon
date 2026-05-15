const preferenceChips = [
  "Hızlı kargo",
  "Kolay iade",
  "Old-money stil",
  "Premium kalite",
  "Bütçe hassasiyeti",
  "Sentetik kumaş istemem",
];

const reviewHistory = [
  {
    product: "FlowMate Sessiz Kablosuz Mouse",
    note: "Kargo hızı ve sessiz kullanım beklentimi karşıladı.",
  },
  {
    product: "AirBeat Spor Kablosuz Kulaklık",
    note: "Uzun kullanımda konfor daha iyi anlatılmalıydı.",
  },
  {
    product: "RiseUp Alüminyum Laptop Standı",
    note: "Malzeme kalitesi ve sade tasarım iyi.",
  },
];

export default function BuyerProfilePage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Profil</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Agent beni nasıl tanısın?</h2>
        <textarea
          className="mt-6 min-h-44 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          defaultValue="Sade ve kaliteli ürünleri severim. Kargosu hızlı olsun, kumaş ve malzeme kalitesi yorumlarda net görünmeli. Çok iddialı logo ve parlak renk istemem."
          aria-label="Agent kişiselleştirme metni"
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {preferenceChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="min-h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 active:translate-y-px"
            >
              {chip}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 min-h-11 rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px"
        >
          Profili Kaydet
        </button>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Yorum geçmişi</h3>
        <div className="mt-5 divide-y divide-slate-200">
          {reviewHistory.map((review) => (
            <article key={review.product} className="py-4 first:pt-0">
              <p className="text-sm font-semibold text-slate-950">{review.product}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{review.note}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
