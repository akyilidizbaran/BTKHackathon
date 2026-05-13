import { apiError, apiOk } from "@/lib/api/responses";
import { demoSellerId, getSellerProductsApiData } from "@/lib/api/seller";

export async function GET(): Promise<Response> {
  const data = getSellerProductsApiData(demoSellerId);

  if (!data) {
    return apiError("SELLER_PRODUCTS_NOT_FOUND", "Satıcı ürün verisi bulunamadı.", 404);
  }

  return apiOk(data);
}
