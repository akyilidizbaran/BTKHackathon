import type { LlmGenerationError, LlmProvider, LlmTextGenerationResult, RuntimeLlmProvider } from "@/lib/llm/types";

export const defaultLlmProvider: RuntimeLlmProvider = "gemini";
export const defaultGeminiModel = "gemini-2.5-flash";
export const defaultMaxOutputTokens = 700;
export const defaultTemperature = 0.2;

export function normalizeLlmProvider(value: string | undefined): LlmProvider | undefined {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "gemini" || normalized === "deterministic") {
    return normalized;
  }

  return undefined;
}

export function getRequestedLlmProvider(): string {
  return process.env.LLM_PROVIDER?.trim().toLowerCase() || defaultLlmProvider;
}

export function getConfiguredLlmProvider(): LlmProvider {
  return normalizeLlmProvider(getRequestedLlmProvider()) ?? "deterministic";
}

export function getLlmModelForProvider(provider: LlmProvider): string {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
    case "deterministic":
      return process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
  }
}

export function getConfiguredLlmModel(): string {
  return getLlmModelForProvider(getConfiguredLlmProvider());
}

export function createLlmFallbackResult(input: {
  error: LlmGenerationError;
  model: string;
  provider?: LlmProvider;
  text: string;
}): LlmTextGenerationResult {
  return {
    error: input.error,
    generatedAt: new Date().toISOString(),
    model: input.model,
    provider: input.provider ?? "deterministic",
    status: "fallback",
    text: input.text,
  };
}
