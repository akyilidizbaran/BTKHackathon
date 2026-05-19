import {
  createLlmFallbackResult,
  defaultGeminiModel,
  defaultMaxOutputTokens,
  defaultTemperature,
} from "@/lib/llm/common";
import type { GenerateTextInput, LlmTextGenerationResult } from "@/lib/llm/types";

const geminiOpenAiCompatibleChatEndpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const geminiMaxAttempts = 3;
const geminiRetryBaseDelayMs = 500;

interface GeminiChatCompletionsResponseBody {
  choices?: Array<{
    message?: {
      content?: string | Array<{
        text?: string;
        type?: string;
      }>;
    };
  }>;
  error?: {
    code?: string;
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
  const reasoningEffort = getGeminiReasoningEffort(model);

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
      const response = await fetch(geminiOpenAiCompatibleChatEndpoint, {
        body: JSON.stringify({
          max_tokens: input.maxOutputTokens ?? defaultMaxOutputTokens,
          messages: [
            {
              content: input.instructions,
              role: "system",
            },
            {
              content: input.input,
              role: "user",
            },
          ],
          model,
          ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
          temperature: input.temperature ?? defaultTemperature,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(25000),
      });
      const body = (await response.json()) as GeminiChatCompletionsResponseBody;

      if (!response.ok) {
        lastRequestError = {
          code: body.error?.code || body.error?.status || `GEMINI_HTTP_${response.status}`,
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

function getGeminiReasoningEffort(model: string): "none" | undefined {
  // Gemini Flash reasoning can consume the short response budget; JSON contracts need tokens for the body.
  return /^gemini-2\.5-flash(?:-|$)/.test(model) || model === "gemini-3-flash-preview"
    ? "none"
    : undefined;
}

function isRetryableGeminiHttpStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function waitBeforeGeminiRetry(attempt: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, geminiRetryBaseDelayMs * attempt);
  });
}

function extractGeminiOutputText(body: GeminiChatCompletionsResponseBody): string {
  const content = body.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  return (
    content
      ?.map((item) => item.text)
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
