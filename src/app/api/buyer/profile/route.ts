import { apiError, apiOk } from "@/lib/api/responses";
import {
  getBuyerProfileApiData,
  validateBuyerProfilePatchRequest,
} from "@/lib/api/buyer-profile";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const data = getBuyerProfileApiData({
    buyerId: url.searchParams.get("buyerId"),
  });

  if (!data) {
    return apiError("BUYER_NOT_FOUND", "Alıcı profili bulunamadı.", 404);
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

  const validation = validateBuyerProfilePatchRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  const data = getBuyerProfileApiData({
    buyerId: validation.value.buyerId,
    editableOverride: validation.value,
    method: "PATCH",
  });

  if (!data) {
    return apiError("BUYER_NOT_FOUND", "Alıcı profili bulunamadı.", 404);
  }

  return apiOk(data);
}
