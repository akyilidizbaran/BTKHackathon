import { SellerProfileWorkspace } from "@/components/commerce/seller-profile-workspace";
import { getDefaultSellerProfileApiData } from "@/lib/api/seller-profile";

export default function SellerProfilePage() {
  return (
    <SellerProfileWorkspace initialData={getDefaultSellerProfileApiData()} />
  );
}
