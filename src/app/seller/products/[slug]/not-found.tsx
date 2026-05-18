import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <p className="text-sm text-emerald-200/80">Ürün detayı</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Ürün bulunamadı.</h2>
      <p className="mt-4 max-w-[60ch] text-sm leading-7 text-zinc-500">
        Bu ürün kaydı bulunamadı. Ürün radarından geçerli bir ürün seç.
      </p>
      <Link
        href="/seller/products"
        className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-300 px-5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-200 active:translate-y-px"
      >
        Ürün radarına dön
      </Link>
    </div>
  );
}
