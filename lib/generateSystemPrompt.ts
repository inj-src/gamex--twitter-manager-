import type { StoredReply } from "./types";
import { getPromptOrDefault } from "./systemPrompts";

export function generateSystemPrompt(
  userInstructions?: string,
  useMemory?: boolean,
  storedReplies?: StoredReply[],
  promptId?: string
): string {
  const preset = getPromptOrDefault(promptId);
  console.log("[PromptBuilder] Selected preset:", preset.name);
  const prompt = preset.generatePrompt(userInstructions, useMemory, storedReplies, promptId);
  return prompt;
}

