import { BuyerAgentWorkspace } from "@/components/commerce/buyer-agent-workspace";
import { buyerSmartCartExamples } from "@/lib/api/buyer";
import { getDefaultBuyerAgentApiData } from "@/lib/api/buyer-agent";

export default function BuyerAgentPage() {
  return (
    <BuyerAgentWorkspace
      examples={buyerSmartCartExamples}
      initialData={getDefaultBuyerAgentApiData()}
    />
  );
}
