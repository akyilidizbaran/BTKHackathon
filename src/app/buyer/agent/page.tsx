import Link from "next/link";
import { buyerSmartCartExamples } from "@/lib/api/buyer";

export default function BuyerAgentPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Agent</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Alışveriş sohbeti</h2>
        <div className="mt-6 space-y-3">
          {buyerSmartCartExamples.slice(0, 4).map((example) => (
            <button
              key={example.id}
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-orange-200 hover:bg-orange-50 active:translate-y-px"
            >
              <span className="block text-sm font-semibold text-slate-950">{example.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">{example.prompt}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="min-h-[620px] rounded-lg border border-slate-200 bg-white shadow-[0_18px_54px_-48px_rgba(15,23,42,0.65)]">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">CommercePilot Agent</h3>
          <p className="mt-1 text-sm text-slate-500">Katalogdaki mevcut ürünlerle cevap verir.</p>
        </div>

        <div className="space-y-4 p-5">
          <div className="max-w-[78%] rounded-lg bg-slate-100 p-4 text-sm leading-6 text-slate-700">
            Merhaba, bütçeni ve aradığın stili yazabilirsin. Ürünleri kart olarak getirip onayını isterim.
          </div>
          <div className="ml-auto max-w-[78%] rounded-lg bg-orange-500 p-4 text-sm font-medium leading-6 text-[#fff]">
            3000 TL altı old-money kazak ve pantolon getir.
          </div>
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <SuggestionCard title="Öneri kartları" helper="Katalog ürünleriyle oluşturulan seçki." />
            <SuggestionCard title="Mevcut sepet korunur" helper="İstersen yeni seçkiyle değiştirebilirsin." />
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 p-5">
          <form className="flex gap-3">
            <input
              aria-label="Agent mesajı"
              className="min-h-12 flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
              placeholder="İhtiyacını, bütçeni veya stilini yaz"
            />
            <button
              type="button"
              className="min-h-12 rounded-full bg-slate-950 px-6 text-sm font-semibold text-[#fff] transition hover:bg-slate-800 active:translate-y-px"
            >
              Gönder
            </button>
          </form>
          <Link href="/buyer/cart" className="mt-4 inline-flex text-sm font-semibold text-orange-700 hover:text-orange-800">
            Sepeti aç
          </Link>
        </div>
      </section>
    </div>
  );
}

function SuggestionCard({ title, helper }: { title: string; helper: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}
