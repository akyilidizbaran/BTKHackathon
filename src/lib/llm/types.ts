export type LlmProvider = "openai" | "deterministic";

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
  metadata?: Record<string, string>;
}
