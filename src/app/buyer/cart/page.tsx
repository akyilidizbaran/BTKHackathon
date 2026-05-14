import { buyerSmartCartExamples, getBuyerSmartCartApiData } from "@/lib/api/buyer";

export default function BuyerCartPage() {
  const example = buyerSmartCartExamples.find((item) => item.id === "desk-style") ?? buyerSmartCartExamples[0];
  const data = getBuyerSmartCartApiData({
    buyerId: example.buyerId,
    prompt: example.prompt,
  });

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-emerald-200/80">Sepet karar özeti</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
            Sepet kararı hazır.
          </h2>
          <p className="mt-5 max-w-[68ch] text-sm leading-7 text-zinc-500">
            Rol bazlı ürün seçimi, bütçe durumu, uyarılar ve satıcıya dönen sinyaller tek karar ekranında
            okunur.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <p className="text-sm text-zinc-500">Komut</p>
          <p className="mt-4 text-xl font-medium leading-8 tracking-[-0.03em] text-white">{data.request.prompt}</p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
            <Metric label="Toplam" value={formatTry(data.summary.totalPrice)} />
            <Metric label="Güven" value={`${data.summary.confidenceScore}/100`} />
            <Metric label="Ürün" value={String(data.summary.itemCount)} />
            <Metric label="Uyarı" value={String(data.summary.warningCount)} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Seçili ürünler</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Her ürün bir rol taşır; karar gerekçesi ve fiyat aynı satırda tutulur.
              </p>
            </div>
            <p className="font-mono text-sm text-emerald-100">{data.summary.budgetStatusLabel}</p>
          </div>

          <div className="divide-y divide-white/10">
            {data.result.selectedItems.map((item) => (
              <article key={item.productId} className="grid gap-4 py-5 md:grid-cols-[160px_1fr_130px_80px]">
                <div>
                  <p className="text-sm text-emerald-200/80">{item.cartRole}</p>
                  <p className="mt-2 text-xs text-zinc-500">{item.category}</p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-white">{item.productName}</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.reasons[0]}</p>
                  {item.warnings[0] ? (
                    <p className="mt-3 text-xs leading-5 text-amber-100/80">{item.warnings[0].title}</p>
                  ) : null}
                </div>
                <p className="font-mono text-sm text-white">{formatTry(item.price)}</p>
                <p className="font-mono text-sm text-zinc-500">x{item.quantity}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <DecisionPanel title="Alıcı güveni">
            <div className="border-t border-white/10 pt-4">
              <p className="font-mono text-4xl tracking-[-0.06em] text-white">{data.summary.confidenceScore}/100</p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {data.summary.intentLabel} için seçilen ürünler bütçe, rol ve kişisel hassasiyetlere göre sıralandı.
              </p>
            </div>
          </DecisionPanel>

          <DecisionPanel title="Alternatifler">
            {[...data.result.alternatives.slice(0, 2), ...data.result.complementarySuggestions.slice(0, 2)].map(
              (suggestion) => (
                <div key={`${suggestion.productId}-${suggestion.reason}`} className="border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-white">{suggestion.productName}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{suggestion.reason}</p>
                  <p className="mt-3 font-mono text-xs text-emerald-200/80">{formatTry(suggestion.price)}</p>
                </div>
              ),
            )}
          </DecisionPanel>

          <DecisionPanel title="Satıcı sinyalleri">
            {data.result.sellerSignalCandidates.slice(0, 3).map((signal) => (
              <div key={`${signal.type}-${signal.summary}`} className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-white">{getSignalLabel(signal.type)}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{signal.summary}</p>
              </div>
            ))}
          </DecisionPanel>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950/55 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-lg tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function DecisionPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-6">
      <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">{title}</h3>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function getSignalLabel(type: string): string {
  const labels: Record<string, string> = {
    bundle_opportunity: "Bundle fırsatı",
    buyer_demand: "Talep sinyali",
    color_demand: "Renk talebi",
    review_friction: "Yorum sürtünmesi",
    shipping_friction: "Kargo sürtünmesi",
  };

  return labels[type] ?? type;
}
