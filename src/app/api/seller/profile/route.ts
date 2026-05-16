import { apiError, apiOk } from "@/lib/api/responses";
import {
  getSellerProfileApiData,
  validateSellerProfilePatchRequest,
} from "@/lib/api/seller-profile";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const data = getSellerProfileApiData({
    sellerId: url.searchParams.get("sellerId"),
  });

  if (!data) {
    return apiError("SELLER_NOT_FOUND", "Satıcı profili bulunamadı.", 404);
  }

  return apiOk(data);
}

export async function PATCH(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateSellerProfilePatchRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  const data = getSellerProfileApiData({
    editableOverride: validation.value,
    method: "PATCH",
    sellerId: validation.value.sellerId,
  });

  if (!data) {
    return apiError("SELLER_NOT_FOUND", "Satıcı profili bulunamadı.", 404);
  }

  return apiOk(data);
}
