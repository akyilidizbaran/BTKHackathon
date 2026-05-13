import { apiError, apiOk } from "@/lib/api/responses";
import { demoSellerId, getSellerActionsApiData } from "@/lib/api/seller";

export async function GET(): Promise<Response> {
  const data = getSellerActionsApiData(demoSellerId);

  if (!data) {
    return apiError("SELLER_ACTIONS_NOT_FOUND", "Satıcı aksiyon verisi bulunamadı.", 404);
  }

  return apiOk(data);
}
