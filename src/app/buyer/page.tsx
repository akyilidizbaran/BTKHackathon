import { BuyerSmartCartWorkspace } from "@/components/commerce/buyer-smart-cart-workspace";
import {
  buyerSmartCartExamples,
  getDefaultBuyerSmartCartApiData,
} from "@/lib/api/buyer";

export default function BuyerWorkspacePage() {
  return (
    <BuyerSmartCartWorkspace
      examples={buyerSmartCartExamples}
      initialData={getDefaultBuyerSmartCartApiData()}
    />
  );
}
