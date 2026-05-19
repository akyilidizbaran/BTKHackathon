export type LlmProvider = "gemini" | "deterministic";
export type RuntimeLlmProvider = Exclude<LlmProvider, "deterministic">;

export interface LlmGenerationError {
  code: string;
  message: string;
}

export interface LlmTextGenerationResult {
  status: "generated" | "fallback";
  provider: LlmProvider;
  model: string;
  text: string;
  generatedAt: string;
  error?: LlmGenerationError;
}

export interface GenerateTextInput {
  instructions: string;
  input: string;
  fallbackText: string;
  maxOutputTokens?: number;
  metadata?: Record<string, string>;
  temperature?: number;
}

export interface LlmJsonValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface LlmJsonValidationError {
  ok: false;
  code: string;
  message: string;
}

export type LlmJsonValidationResult<T> = LlmJsonValidationSuccess<T> | LlmJsonValidationError;

export interface GenerateJsonInput<T> extends Omit<GenerateTextInput, "fallbackText"> {
  fallbackText?: string;
  fallbackValue: T;
  forceFallback?: boolean;
  modelTextOverride?: string;
  modelTextOverrideProvider?: LlmProvider;
  validate: (value: Record<string, unknown>, fallbackValue: T) => LlmJsonValidationResult<T>;
}

export interface LlmJsonGenerationResult<T> {
  status: "generated" | "fallback";
  provider: LlmProvider;
  model: string;
  text: string;
  value: T;
  generatedAt: string;
  usedFallback: boolean;
  error?: LlmGenerationError;
  fallbackReason?: string;
}
