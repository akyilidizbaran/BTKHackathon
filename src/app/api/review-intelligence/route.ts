import { apiError, apiOk } from "@/lib/api/responses";
import {
  getReviewIntelligenceApiData,
  validateReviewIntelligenceRequest,
} from "@/lib/api/review-intelligence";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Geçerli bir JSON gövdesi gönderilmeli.", 400);
  }

  const validation = validateReviewIntelligenceRequest(body);

  if (!validation.ok) {
    return apiError(validation.code, validation.message, validation.status);
  }

  const data = await getReviewIntelligenceApiData(validation.value);

  if (!data) {
    return apiError("REVIEW_INTELLIGENCE_NOT_FOUND", "Review Intelligence verisi bulunamadı.", 404);
  }

  return apiOk(data);
}
