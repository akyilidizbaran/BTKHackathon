import { apiError, apiOk } from "@/lib/api/responses";
import { demoSellerId, getSellerProductsApiData } from "@/lib/api/seller";

export async function GET(request: Request): Promise<Response> {
  const focus = new URL(request.url).searchParams.get("focus");
  const data = getSellerProductsApiData(demoSellerId, { focus });

  if (!data) {
    return apiError("SELLER_PRODUCTS_NOT_FOUND", "Satıcı ürün verisi bulunamadı.", 404);
  }

  return apiOk(data);
}
