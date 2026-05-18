import {
  createLlmFallbackResult,
  defaultMaxOutputTokens,
  defaultOpenAiModel,
  defaultTemperature,
} from "@/lib/llm/common";
import type { GenerateTextInput, LlmTextGenerationResult } from "@/lib/llm/types";

const openAiResponsesEndpoint = "https://api.openai.com/v1/responses";

interface OpenAiResponseBody {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    code?: string;
    message?: string;
  };
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || defaultOpenAiModel;
}

export async function generateOpenAiText(input: GenerateTextInput): Promise<LlmTextGenerationResult> {
  const model = getOpenAiModel();
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return createFallbackResult(
      model,
      input.fallbackText,
      {
        code: "OPENAI_API_KEY_MISSING",
        message: "OPENAI_API_KEY tanımlı değil; deterministik fallback kullanıldı.",
      },
      "deterministic",
    );
  }

  try {
    const response = await fetch(openAiResponsesEndpoint, {
      body: JSON.stringify({
        input: input.input,
        instructions: input.instructions,
        max_output_tokens: input.maxOutputTokens ?? defaultMaxOutputTokens,
        metadata: input.metadata,
        model,
        store: false,
        temperature: input.temperature ?? defaultTemperature,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(25000),
    });
    const body = (await response.json()) as OpenAiResponseBody;

    if (!response.ok) {
      return createFallbackResult(model, input.fallbackText, {
        code: body.error?.code || `OPENAI_HTTP_${response.status}`,
        message: body.error?.message || "OpenAI API isteği başarısız oldu; deterministik fallback kullanıldı.",
      });
    }

    const text = extractOpenAiOutputText(body).trim();

    if (!text) {
      return createFallbackResult(model, input.fallbackText, {
        code: "OPENAI_EMPTY_OUTPUT",
        message: "OpenAI boş çıktı döndürdü; deterministik fallback kullanıldı.",
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      model,
      provider: "openai",
      status: "generated",
      text,
    };
  } catch (error) {
    return createFallbackResult(model, input.fallbackText, {
      code: "OPENAI_REQUEST_FAILED",
      message: error instanceof Error ? error.message : "OpenAI isteği tamamlanamadı.",
    });
  }
}

function extractOpenAiOutputText(body: OpenAiResponseBody): string {
  if (typeof body.output_text === "string") {
    return body.output_text;
  }

  return (
    body.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text))
      .join("\n") ?? ""
  );
}

function createFallbackResult(
  model: string,
  text: string,
  error: NonNullable<LlmTextGenerationResult["error"]>,
  provider: LlmTextGenerationResult["provider"] = "openai",
): LlmTextGenerationResult {
  return createLlmFallbackResult({
    error,
    model,
    provider,
    text,
  });
}
