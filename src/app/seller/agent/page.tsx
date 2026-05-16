import { SellerAgentWorkspace } from "@/components/commerce/seller-agent-workspace";
import {
  getDefaultSellerAgentApiData,
  sellerAgentExamples,
} from "@/lib/api/seller-agent";

export default function SellerAgentPage() {
  return (
    <SellerAgentWorkspace
      examples={sellerAgentExamples}
      initialData={getDefaultSellerAgentApiData()}
    />
  );
}
