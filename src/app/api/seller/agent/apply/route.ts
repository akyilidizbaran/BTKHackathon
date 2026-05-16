import { apiError, apiOk } from "@/lib/api/responses";
import {
  getSellerListingMutationApplyApiData,
  validateSellerListingMutationApplyRequest,
} from "@/lib/agents/seller-listing-apply";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateSellerListingMutationApplyRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  const data = getSellerListingMutationApplyApiData(validation.value);

  if (!data) {
    return apiError("PRODUCT_NOT_FOUND", "Uygulanacak ürün satıcı kataloğunda bulunamadı.", 404);
  }

  if (data.delta.length === 0) {
    return apiError("EMPTY_MUTATION", "En az bir listing alanı değişmeli.", 400);
  }

  return apiOk(data);
}
