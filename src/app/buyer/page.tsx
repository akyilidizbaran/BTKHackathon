import { buildSmartCartWorkflow } from "@/lib/workflows";

const demoPrompt = "Kargo hızı yüksek olan 3000 TL altında ev ofis setup kur.";

export default function BuyerWorkspacePage() {
  const result = buildSmartCartWorkflow({
    buyerId: "buyer-aylin",
    prompt: demoPrompt,
  });

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-emerald-200/80">Alışveriş asistanı</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            Ne almak istediğini doğal dille yaz.
          </h2>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-zinc-950/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <label className="block text-sm text-zinc-400" htmlFor="buyer-command">
              Komut
            </label>
            <div
              id="buyer-command"
              className="mt-3 min-h-16 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-base leading-7 text-white"
            >
              {demoPrompt}
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Bu milestone’da input pasif; sonraki adımda API route ile canlı çalışacak.
            </p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Kişiselleştirme sinyali</p>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {result.buyerPersonalizationNotes.slice(0, 4).map((note) => (
              <p key={note} className="py-4 text-sm leading-6 text-zinc-300">
                {note}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Önerilen sepet</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Toplam: {Math.round(result.totalPrice).toLocaleString("tr-TR")} TL · Güven: {result.confidenceScore}/100
              </p>
            </div>
            <span className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-medium text-zinc-950">
              {result.intent.type}
            </span>
          </div>

          <div className="mt-2 divide-y divide-white/10">
            {result.selectedItems.map((item) => (
              <div key={item.productId} className="grid gap-4 py-5 md:grid-cols-[180px_1fr_120px]">
                <div>
                  <p className="text-sm text-emerald-200/80">{item.cartRole}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.category}</p>
                </div>
                <div>
                  <h3 className="font-medium text-white">{item.productName}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.reasons[0]}</p>
                </div>
                <div className="font-mono text-lg tracking-[-0.04em] text-white">
                  {Math.round(item.price).toLocaleString("tr-TR")} TL
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Satın almadan önce bil</h2>
          <div className="mt-5 space-y-4">
            {result.warnings.slice(0, 4).map((warning) => (
              <div key={`${warning.title}-${warning.productId ?? "workflow"}`} className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-white">{warning.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{warning.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
