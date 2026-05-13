import { apiError, apiOk } from "@/lib/api/responses";
import { demoSellerId, getSellerOverviewApiData } from "@/lib/api/seller";

export async function GET(): Promise<Response> {
  const data = getSellerOverviewApiData(demoSellerId);

  if (!data) {
    return apiError("SELLER_OVERVIEW_NOT_FOUND", "Satıcı genel bakış verisi bulunamadı.", 404);
  }

  return apiOk(data);
}
