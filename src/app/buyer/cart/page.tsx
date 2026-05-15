import { BuyerCartWorkspace } from "@/components/commerce/buyer-cart-workspace";
import { getBuyerCatalogApiData } from "@/lib/api/buyer-catalog";

export default function BuyerCartPage() {
  const data = getBuyerCatalogApiData();

  return <BuyerCartWorkspace products={data.products} />;
}
