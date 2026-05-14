import { generateOpenAiText } from "@/lib/llm/openai";
import type { GenerateTextInput, LlmTextGenerationResult } from "@/lib/llm/types";

export type { GenerateTextInput, LlmGenerationError, LlmProvider, LlmTextGenerationResult } from "@/lib/llm/types";

export async function generateLlmText(input: GenerateTextInput): Promise<LlmTextGenerationResult> {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase() || "openai";

  if (provider !== "openai") {
    return {
      error: {
        code: "UNSUPPORTED_LLM_PROVIDER",
        message: `${provider} provider'ı bu milestone'da aktif değil; deterministik fallback kullanıldı.`,
      },
      generatedAt: new Date().toISOString(),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "deterministic",
      status: "fallback",
      text: input.fallbackText,
    };
  }

  return generateOpenAiText(input);
}
