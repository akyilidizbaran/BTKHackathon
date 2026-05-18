import { apiError, apiOk } from "@/lib/api/responses";
import {
  getFloatingAgentApiData,
  validateFloatingAgentRequest,
} from "@/lib/api/floating-agent";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateFloatingAgentRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  return apiOk(await getFloatingAgentApiData(validation.value));
}
