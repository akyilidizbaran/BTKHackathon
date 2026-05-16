import { apiError, apiOk } from "@/lib/api/responses";
import {
  getDefaultSellerAgentApiData,
  getSellerAgentApiData,
  validateSellerAgentRequest,
} from "@/lib/api/seller-agent";

export async function GET(): Promise<Response> {
  return apiOk(getDefaultSellerAgentApiData());
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateSellerAgentRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  return apiOk(getSellerAgentApiData(validation.value));
}
