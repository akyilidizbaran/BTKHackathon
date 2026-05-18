import { SellerOverviewWorkspace } from "@/components/commerce/seller-overview-workspace";
import { getSellerOverviewApiData, getSellerProductsApiData } from "@/lib/api/seller";

export default function SellerOverviewPage() {
  const overview = getSellerOverviewApiData();
  const products = getSellerProductsApiData();

  if (!overview || !products) {
    return (
      <EmptyPanel
        title="Satıcı verisi bulunamadı"
        description="Satıcı özeti şu anda hazırlanamadı. Biraz sonra tekrar dene."
      />
    );
  }

  return <SellerOverviewWorkspace overview={overview} products={products} />;
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
