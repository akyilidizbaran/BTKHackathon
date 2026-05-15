import Link from "next/link";
import { getSellerActionsApiData, getSellerProductsApiData } from "@/lib/api/seller";

export default function SellerAgentPage() {
  const actions = getSellerActionsApiData();
  const products = getSellerProductsApiData();
  const riskyProducts = products?.products
    .filter((product) => product.healthScore < 75)
    .sort((first, second) => first.healthScore - second.healthScore)
    .slice(0, 4) ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Seller Agent</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Satıcı sohbeti</h2>
        <div className="mt-6 space-y-3">
          {["Satılmayan ürünlerimi sırala", "Negatif yorumları grupla", "Stok riski olanları göster", "Listelemeyi nasıl düzeltirim?"].map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:bg-orange-50 active:translate-y-px"
            >
              {prompt}
            </button>
          ))}
        </div>
      </aside>

      <section className="min-h-[620px] rounded-lg border border-slate-200 bg-white shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">CommercePilot Seller Agent</h3>
          <p className="mt-1 text-sm text-slate-500">Önce/sonra taslakları satıcı onayıyla ilerler.</p>
        </div>

        <div className="space-y-4 p-5">
          <div className="max-w-[78%] rounded-lg bg-slate-100 p-4 text-sm leading-6 text-slate-700">
            Satılmayan veya risk taşıyan ürünleri sağlık skoru, yorum ve stok sinyallerine göre sıralayabilirim.
          </div>
          <div className="ml-auto max-w-[78%] rounded-lg bg-orange-500 p-4 text-sm font-medium leading-6 text-[#fff]">
            Satılmayan ürünlerimi sırala.
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-slate-950">Riskli ürünler</h4>
              <Link href="/seller/products" className="text-sm font-semibold text-orange-700 hover:text-orange-800">
                Ürünlere git
              </Link>
            </div>
            <div className="mt-4 divide-y divide-slate-200">
              {riskyProducts.map((product) => (
                <Link
                  key={product.id}
                  href={product.href}
                  className="grid gap-3 py-3 transition hover:bg-white md:grid-cols-[1fr_88px]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.stockStatusLabel} · {product.reviewCount} yorum</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-slate-950">{product.healthScore}/100</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(actions?.actions.slice(0, 2) ?? []).map((action) => (
              <Link
                key={action.id}
                href={`/seller/actions/${action.id}`}
                className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-orange-200 hover:bg-orange-50"
              >
                <p className="text-sm font-semibold text-slate-950">{action.title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{action.expectedOutcome}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 p-5">
          <form className="flex gap-3">
            <input
              aria-label="Seller Agent mesajı"
              className="min-h-12 flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
              placeholder="Satıcı verinle ilgili bir komut yaz"
            />
            <button
              type="button"
              className="min-h-12 rounded-full bg-slate-950 px-6 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
            >
              Gönder
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
