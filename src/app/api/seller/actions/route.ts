import { apiError, apiOk } from "@/lib/api/responses";
import { demoSellerId, getSellerActionsApiData } from "@/lib/api/seller";

export async function GET(request: Request): Promise<Response> {
  const focus = new URL(request.url).searchParams.get("focus");
  const data = getSellerActionsApiData(demoSellerId, { focus });

  if (!data) {
    return apiError("SELLER_ACTIONS_NOT_FOUND", "Satıcı aksiyon verisi bulunamadı.", 404);
  }

  return apiOk(data);
}
