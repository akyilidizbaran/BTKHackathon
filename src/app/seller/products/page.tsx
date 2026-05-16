import {
  getSellerProductsApiData,
  normalizeSellerProductsFocus,
} from "@/lib/api/seller";
import { SellerProductsWorkspace } from "@/components/commerce/seller-products-workspace";

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string | string[] | undefined }>;
}) {
  const data = getSellerProductsApiData();
  const initialFocus = normalizeSellerProductsFocus((await searchParams).focus);

  if (!data) {
    return (
      <EmptyPanel
        title="Ürün contract'ı üretilemedi"
        description="Demo satıcı ürünleri okunamadı. Mock product ve seller id referansları kontrol edilmeli."
      />
    );
  }

  return <SellerProductsWorkspace key={initialFocus} data={data} initialFocus={initialFocus} />;
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
