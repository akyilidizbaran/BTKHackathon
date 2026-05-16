import { BuyerProfileWorkspace } from "@/components/commerce/buyer-profile-workspace";
import { getDefaultBuyerProfileApiData } from "@/lib/api/buyer-profile";

export default function BuyerProfilePage() {
  return <BuyerProfileWorkspace initialData={getDefaultBuyerProfileApiData()} />;
}
