import { SellerActionsWorkspace } from "@/components/commerce/seller-actions-workspace";
import {
  getSellerActionsApiData,
  normalizeSellerActionsFocus,
} from "@/lib/api/seller";

export default async function SellerActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string | string[] | undefined }>;
}) {
  const data = getSellerActionsApiData();
  const initialFocus = normalizeSellerActionsFocus((await searchParams).focus);

  if (!data) {
    return (
      <EmptyPanel
        title="Aksiyonlar hazırlanamadı"
        description="Satıcı aksiyonları şu anda okunamadı. Biraz sonra tekrar dene."
      />
    );
  }

  return <SellerActionsWorkspace key={initialFocus} data={data} initialFocus={initialFocus} />;
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
