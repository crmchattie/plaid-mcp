import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic();

export function getLanguageModel(modelId: string) {
  return anthropic(modelId);
}

export function getTitleModel() {
  return anthropic("claude-haiku-4-5-20251001");
}
