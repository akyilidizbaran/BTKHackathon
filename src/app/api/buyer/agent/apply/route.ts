import { apiError, apiOk } from "@/lib/api/responses";
import {
  getBuyerAgentApplyApiData,
  validateBuyerAgentApplyRequest,
} from "@/lib/api/buyer-agent";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateBuyerAgentApplyRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  const data = getBuyerAgentApplyApiData(validation.value);

  if (data.items.length === 0) {
    return apiError("PRODUCTS_NOT_FOUND", "Önerilen ürünler katalogda bulunamadı.", 404);
  }

  return apiOk(data);
}
