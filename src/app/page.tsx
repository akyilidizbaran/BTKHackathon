export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-neutral-50">
      <main className="w-full max-w-3xl">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-emerald-300">
          CommercePilot
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Çift taraflı commerce intelligence temeli hazır.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
          Milestone 0 tamamlandığında bu uygulama satıcı büyüme aksiyonları,
          alıcı karar desteği ve ileride eklenecek LLM destekli iş akışları için
          sağlam bir Next.js zemini olarak kullanılacak.
        </p>
      </main>
    </div>
  );
}
