import { apiError, apiOk } from "@/lib/api/responses";
import { getSellerProductHealthApiData } from "@/lib/api/seller";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const data = getSellerProductHealthApiData(id);

  if (!data) {
    return apiError("PRODUCT_HEALTH_NOT_FOUND", "Ürün sağlık analizi bulunamadı.", 404);
  }

  return apiOk(data);
}
