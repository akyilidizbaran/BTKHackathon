import { getSellerOverviewApiData } from "@/lib/api/seller";

const permissionModes = [
  {
    title: "Sadece sohbet",
    helper: "Agent analiz eder, ürün alanlarına dokunmaz.",
  },
  {
    title: "Öneri ve taslak",
    helper: "Başlık, açıklama ve kampanya taslaklarını önce/sonra olarak gösterir.",
  },
  {
    title: "Onaylı uygulama",
    helper: "Satıcı onayı sonrası mock listeleme değişikliklerini uygular.",
  },
];

export default function SellerProfilePage() {
  const data = getSellerOverviewApiData();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Mağaza profili</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          {data?.seller.displayName ?? "CommercePilot mağazası"}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Mağaza adı" value={data?.seller.displayName ?? "CommercePilot"} />
          <Field label="Destek yanıtı" value={`${data?.seller.supportResponseHours ?? 4} saat`} />
          <Field label="Varsayılan teslimat" value={`${data?.seller.defaultDeliveryPromiseDays ?? 3} gün`} />
          <Field label="Mağaza puanı" value={data?.seller.rating.toFixed(1) ?? "4.6"} />
        </div>
        <button
          type="button"
          className="mt-6 min-h-11 rounded-full bg-orange-500 px-5 text-sm font-semibold text-[#fff] transition hover:bg-orange-600 active:translate-y-px"
        >
          Profili Kaydet
        </button>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Agent yetkileri</h3>
        <div className="mt-5 space-y-3">
          {permissionModes.map((mode, index) => (
            <label
              key={mode.title}
              className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50"
            >
              <input
                type="radio"
                name="seller-agent-mode"
                defaultChecked={index === 1}
                className="mt-1 h-4 w-4 accent-orange-500"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-950">{mode.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{mode.helper}</span>
              </span>
            </label>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-slate-50 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <input
        className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
        defaultValue={value}
      />
    </label>
  );
}
