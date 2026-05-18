import Link from "next/link";

export default function SellerActionDetailNotFound() {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-zinc-950/35 p-6">
      <p className="text-sm font-medium text-white">Aksiyon detayı bulunamadı</p>
      <p className="mt-2 max-w-[60ch] text-sm leading-6 text-zinc-500">
        Bu aksiyon kaydı bulunamadı. Aksiyon listesine dönüp geçerli bir kayıt seç.
      </p>
      <Link
        href="/seller/actions"
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-emerald-300 px-5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-200 active:translate-y-px"
      >
        Aksiyonlara dön
      </Link>
    </div>
  );
}
