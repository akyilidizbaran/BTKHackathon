import { apiError, apiOk } from "@/lib/api/responses";
import { getBuyerSmartCartExplanationApiData } from "@/lib/api/buyer-smart-cart-explanations";
import { validateBuyerSmartCartRequest } from "@/lib/api/buyer";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateBuyerSmartCartRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  return apiOk(await getBuyerSmartCartExplanationApiData(validation.value));
}
