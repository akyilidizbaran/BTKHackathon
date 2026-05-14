import { apiError, apiOk } from "@/lib/api/responses";
import { demoSellerId, getSellerActionDetailApiData } from "@/lib/api/seller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const data = getSellerActionDetailApiData(id, demoSellerId);

  if (!data) {
    return apiError("SELLER_ACTION_DETAIL_NOT_FOUND", "Satıcı aksiyon detayı bulunamadı.", 404);
  }

  return apiOk(data);
}
