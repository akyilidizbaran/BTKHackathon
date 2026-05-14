import { apiError, apiOk } from "@/lib/api/responses";
import { getSellerActionExplanationApiData } from "@/lib/api/seller-action-explanations";
import { demoSellerId } from "@/lib/api/seller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const data = await getSellerActionExplanationApiData(id, { sellerId: demoSellerId });

  if (!data) {
    return apiError("SELLER_ACTION_EXPLANATION_NOT_FOUND", "Satıcı aksiyon açıklaması bulunamadı.", 404);
  }

  return apiOk(data);
}
