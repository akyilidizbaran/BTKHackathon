import { apiError, apiOk } from "@/lib/api/responses";
import {
  getBuyerAgentApiData,
  getDefaultBuyerAgentApiData,
  validateBuyerAgentRequest,
} from "@/lib/api/buyer-agent";

export async function GET(): Promise<Response> {
  return apiOk(getDefaultBuyerAgentApiData());
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateBuyerAgentRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  return apiOk(getBuyerAgentApiData(validation.value));
}
