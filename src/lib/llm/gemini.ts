import {
  createLlmFallbackResult,
  defaultGeminiModel,
  defaultMaxOutputTokens,
  defaultTemperature,
} from "@/lib/llm/common";
import type { GenerateTextInput, LlmTextGenerationResult } from "@/lib/llm/types";

const geminiGenerateContentBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
const geminiMaxAttempts = 3;
const geminiRetryBaseDelayMs = 500;

interface GeminiGenerateContentRequestBody {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    maxOutputTokens: number;
    temperature: number;
    thinkingConfig?: {
      thinkingBudget: number;
    };
  };
}

interface GeminiGenerateContentResponseBody {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number | string;
    message?: string;
    status?: string;
  };
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
}

export async function generateGeminiText(input: GenerateTextInput): Promise<LlmTextGenerationResult> {
  const model = getGeminiModel();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const endpoint = getGeminiGenerateContentEndpoint(model);

  if (!apiKey) {
    return createFallbackResult(
      model,
      input.fallbackText,
      {
        code: "GEMINI_API_KEY_MISSING",
        message: "GEMINI_API_KEY tanımlı değil; deterministik fallback kullanıldı.",
      },
      "deterministic",
    );
  }

  let lastRequestError: NonNullable<LlmTextGenerationResult["error"]> | undefined;

  for (let attempt = 1; attempt <= geminiMaxAttempts; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(createGeminiGenerateContentBody(input, model)),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        method: "POST",
        signal: AbortSignal.timeout(25000),
      });
      const body = (await response.json()) as GeminiGenerateContentResponseBody;

      if (!response.ok) {
        lastRequestError = {
          code: String(body.error?.code || body.error?.status || `GEMINI_HTTP_${response.status}`),
          message: body.error?.message || "Gemini API isteği başarısız oldu; deterministik fallback kullanıldı.",
        };

        if (isRetryableGeminiHttpStatus(response.status) && attempt < geminiMaxAttempts) {
          await waitBeforeGeminiRetry(attempt);
          continue;
        }

        return createFallbackResult(model, input.fallbackText, lastRequestError);
      }

      const text = extractGeminiOutputText(body).trim();

      if (!text) {
        return createFallbackResult(model, input.fallbackText, {
          code: "GEMINI_EMPTY_OUTPUT",
          message: "Gemini boş çıktı döndürdü; deterministik fallback kullanıldı.",
        });
      }

      return {
        generatedAt: new Date().toISOString(),
        model,
        provider: "gemini",
        status: "generated",
        text,
      };
    } catch (error) {
      lastRequestError = {
        code: "GEMINI_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Gemini isteği tamamlanamadı.",
      };

      if (attempt < geminiMaxAttempts) {
        await waitBeforeGeminiRetry(attempt);
        continue;
      }
    }
  }

  return createFallbackResult(
    model,
    input.fallbackText,
    lastRequestError ?? {
      code: "GEMINI_REQUEST_FAILED",
      message: "Gemini isteği tamamlanamadı.",
    },
  );
}

function getGeminiGenerateContentEndpoint(model: string): string {
  return `${geminiGenerateContentBaseUrl}/${encodeURIComponent(model)}:generateContent`;
}

function createGeminiGenerateContentBody(input: GenerateTextInput, model: string): GeminiGenerateContentRequestBody {
  return {
    contents: [
      {
        parts: [
          {
            text: `${input.instructions.trim()}\n\n${input.input.trim()}`,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: input.maxOutputTokens ?? defaultMaxOutputTokens,
      temperature: input.temperature ?? defaultTemperature,
      ...getGeminiThinkingConfig(model),
    },
  };
}

function getGeminiThinkingConfig(model: string): Pick<
  GeminiGenerateContentRequestBody["generationConfig"],
  "thinkingConfig"
> {
  // Short JSON contracts need the output budget reserved for the response body.
  return /^gemini-2\.5-flash(?:-|$)/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {};
}

function isRetryableGeminiHttpStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function waitBeforeGeminiRetry(attempt: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, geminiRetryBaseDelayMs * attempt);
  });
}

function extractGeminiOutputText(body: GeminiGenerateContentResponseBody): string {
  return (
    body.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => Boolean(text))
      .join("\n") ?? ""
  );
}

function createFallbackResult(
  model: string,
  text: string,
  error: NonNullable<LlmTextGenerationResult["error"]>,
  provider: LlmTextGenerationResult["provider"] = "gemini",
): LlmTextGenerationResult {
  return createLlmFallbackResult({
    error,
    model,
    provider,
    text,
  });
}
