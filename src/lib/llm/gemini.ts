import {
  createLlmFallbackResult,
  defaultGeminiModel,
  defaultMaxOutputTokens,
  defaultTemperature,
} from "@/lib/llm/common";
import type { GenerateTextInput, LlmTextGenerationResult } from "@/lib/llm/types";

const geminiOpenAiCompatibleChatEndpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

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
      return createFallbackResult(model, input.fallbackText, {
        code: body.error?.code || body.error?.status || `GEMINI_HTTP_${response.status}`,
        message: body.error?.message || "Gemini API isteği başarısız oldu; deterministik fallback kullanıldı.",
      });
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
    return createFallbackResult(model, input.fallbackText, {
      code: "GEMINI_REQUEST_FAILED",
      message: error instanceof Error ? error.message : "Gemini isteği tamamlanamadı.",
    });
  }
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
