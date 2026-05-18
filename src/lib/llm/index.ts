import {
  createLlmFallbackResult,
  getConfiguredLlmModel,
  getConfiguredLlmProvider,
  getLlmModelForProvider,
  getRequestedLlmProvider,
  normalizeLlmProvider,
} from "@/lib/llm/common";
import { generateGeminiText } from "@/lib/llm/gemini";
import {
  normalizeLlmString,
  normalizeLlmStringArray,
  parseLlmJsonObject,
} from "@/lib/llm/json";
import { generateOpenAiText } from "@/lib/llm/openai";
import type {
  GenerateJsonInput,
  GenerateTextInput,
  LlmGenerationError,
  LlmJsonGenerationResult,
  LlmTextGenerationResult,
} from "@/lib/llm/types";

export {
  getConfiguredLlmModel,
  getConfiguredLlmProvider,
  getLlmModelForProvider,
  getRequestedLlmProvider,
  normalizeLlmString,
  normalizeLlmStringArray,
  normalizeLlmProvider,
  parseLlmJsonObject,
};
export type {
  GenerateJsonInput,
  GenerateTextInput,
  LlmGenerationError,
  LlmJsonGenerationResult,
  LlmJsonValidationError,
  LlmJsonValidationResult,
  LlmJsonValidationSuccess,
  LlmProvider,
  LlmTextGenerationResult,
  RuntimeLlmProvider,
} from "@/lib/llm/types";

export async function generateLlmText(input: GenerateTextInput): Promise<LlmTextGenerationResult> {
  const requestedProvider = getRequestedLlmProvider();
  const provider = normalizeLlmProvider(requestedProvider);

  switch (provider) {
    case "openai":
      return generateOpenAiText(input);
    case "gemini":
      return generateGeminiText(input);
    case "deterministic":
      return createLlmFallbackResult({
        error: {
          code: "DETERMINISTIC_LLM_PROVIDER",
          message: "LLM_PROVIDER=deterministic; deterministik fallback kullanıldı.",
        },
        model: getLlmModelForProvider("deterministic"),
        text: input.fallbackText,
      });
    default:
      return createLlmFallbackResult({
        error: {
          code: "UNSUPPORTED_LLM_PROVIDER",
          message: `${requestedProvider} provider'ı desteklenmiyor; deterministik fallback kullanıldı.`,
        },
        model: getLlmModelForProvider("deterministic"),
        text: input.fallbackText,
      });
  }
}

export async function generateLlmJson<T>(input: GenerateJsonInput<T>): Promise<LlmJsonGenerationResult<T>> {
  const fallbackText = input.fallbackText ?? JSON.stringify(input.fallbackValue);
  const textResult = await getJsonTextGenerationResult(input, fallbackText);
  const parsed = parseLlmJsonObject(textResult.text);

  if (!parsed) {
    return createJsonFallbackResult(textResult, input.fallbackValue, {
      code: "MODEL_JSON_PARSE_FAILED",
      message: "Model çıktısı beklenen JSON object contract'ına uymadı.",
    });
  }

  const validation = input.validate(parsed, input.fallbackValue);

  if (!validation.ok) {
    return createJsonFallbackResult(textResult, input.fallbackValue, {
      code: validation.code,
      message: validation.message,
    });
  }

  const textFallbackReason = getTextFallbackReason(textResult);
  const usedFallback = textResult.status === "fallback";

  return {
    error: textResult.error,
    fallbackReason: textFallbackReason,
    generatedAt: textResult.generatedAt,
    model: textResult.model,
    provider: textResult.provider,
    status: usedFallback ? "fallback" : "generated",
    text: textResult.text,
    usedFallback,
    value: validation.value,
  };
}

async function getJsonTextGenerationResult<T>(
  input: GenerateJsonInput<T>,
  fallbackText: string,
): Promise<LlmTextGenerationResult> {
  if (typeof input.modelTextOverride === "string") {
    return {
      generatedAt: new Date().toISOString(),
      model: getConfiguredLlmModel(),
      provider: input.modelTextOverrideProvider ?? "openai",
      status: "generated",
      text: input.modelTextOverride,
    };
  }

  if (input.forceFallback) {
    return createLlmFallbackResult({
      error: {
        code: "FORCED_FALLBACK",
        message: "Validation canlı LLM çağrısı yapmadan deterministik fallback'i doğruladı.",
      },
      model: getConfiguredLlmModel(),
      text: fallbackText,
    });
  }

  return generateLlmText({
    fallbackText,
    input: input.input,
    instructions: input.instructions,
    maxOutputTokens: input.maxOutputTokens,
    metadata: input.metadata,
    temperature: input.temperature,
  });
}

function createJsonFallbackResult<T>(
  textResult: LlmTextGenerationResult,
  fallbackValue: T,
  fallbackError: LlmGenerationError,
): LlmJsonGenerationResult<T> {
  const error = textResult.error ?? fallbackError;

  return {
    error,
    fallbackReason: `${error.code}: ${error.message}`,
    generatedAt: textResult.generatedAt,
    model: textResult.model,
    provider: textResult.provider,
    status: "fallback",
    text: textResult.text,
    usedFallback: true,
    value: fallbackValue,
  };
}

function getTextFallbackReason(result: LlmTextGenerationResult): string | undefined {
  if (!result.error) {
    return undefined;
  }

  return `${result.error.code}: ${result.error.message}`;
}
