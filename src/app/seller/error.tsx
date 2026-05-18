"use client";

import { useEffect } from "react";

export default function SellerError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <p className="text-sm text-emerald-200/80">Satıcı ekranı</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Seller ekranı yüklenemedi.</h2>
      <p className="mt-4 max-w-[60ch] text-sm leading-7 text-zinc-500">
        Beklenmeyen bir hata oluştu. Sayfayı tekrar yükleyerek devam edebilirsin.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-300 px-5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-200 active:translate-y-px"
      >
        Tekrar dene
      </button>
    </div>
  );
}
