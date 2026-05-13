import { getProducts } from "@/lib/data";

export default function BuyerProductsPage() {
  const products = getProducts().slice(0, 12);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-7">
        <p className="text-sm text-emerald-200/80">Ürün keşfi</p>
        <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.06em] text-white md:text-5xl">
          Katalog, ihtiyaç sinyalleriyle okunacak.
        </h2>
        <p className="mt-5 max-w-[62ch] text-sm leading-7 text-zinc-500">
          Bu sayfa Milestone 6A’da navigasyon omurgası olarak hazır. Sonraki adımda filtreler,
          ürün detayları ve alternatif öneriler burada çalışacak.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-1 hover:bg-white/[0.055]"
          >
            <p className="text-sm text-emerald-200/80">{product.category}</p>
            <h3 className="mt-3 min-h-14 text-lg font-medium tracking-[-0.03em] text-white">{product.name}</h3>
            <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
              <span className="font-mono text-xl tracking-[-0.04em] text-white">
                {Math.round(product.price).toLocaleString("tr-TR")} TL
              </span>
              <span className="text-xs text-zinc-500">{product.fulfillment.deliveryPromiseDays} gün</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
