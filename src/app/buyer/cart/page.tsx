import { buildSmartCartWorkflow } from "@/lib/workflows";

export default function BuyerCartPage() {
  const result = buildSmartCartWorkflow({
    buyerId: "buyer-emre",
    prompt: "Siyah ve gri renklerde masa takımı diz.",
  });

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
        <p className="text-sm text-emerald-200/80">Sepet taslağı</p>
        <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
          Sepet rol bazlı kuruluyor.
        </h2>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
          <Metric label="Toplam" value={`${Math.round(result.totalPrice).toLocaleString("tr-TR")} TL`} />
          <Metric label="Güven" value={`${result.confidenceScore}/100`} />
          <Metric label="Ürün" value={String(result.selectedItems.length)} />
          <Metric label="Uyarı" value={String(result.warnings.length)} />
        </div>

        <div className="mt-6 divide-y divide-white/10">
          {result.selectedItems.map((item) => (
            <div key={item.productId} className="grid gap-4 py-5 md:grid-cols-[180px_1fr_140px]">
              <p className="text-sm text-emerald-200/80">{item.cartRole}</p>
              <p className="text-sm text-white">{item.productName}</p>
              <p className="font-mono text-sm text-zinc-300">
                {Math.round(item.price).toLocaleString("tr-TR")} TL
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/55 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-xl tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}
