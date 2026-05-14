import { apiError, apiOk } from "@/lib/api/responses";
import { demoSellerId, getSellerBuyerSignalsApiData } from "@/lib/api/seller";

export async function GET(): Promise<Response> {
  const data = getSellerBuyerSignalsApiData(demoSellerId);

  if (!data) {
    return apiError("SELLER_BUYER_SIGNALS_NOT_FOUND", "Alıcı sinyali verisi bulunamadı.", 404);
  }

  return apiOk(data);
}
