import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { generateText, UserContent, LanguageModel } from "ai";
// import { streamText } from "ai";

import { searchMemoriesTool } from "@supermemory/tools/ai-sdk";
import { ConversationContext } from "./extract";
import { getState, getStoredReplies } from "./storage";
import { generateSystemPrompt } from "./generateSystemPrompt";
import { constructPrompt } from "./constructPrompt";
import type { Provider } from "./types";

const DEFAULT_OPENROUTER_MODEL = "moonshotai/kimi-k2:free"; // Cost-effective and fast
const DEFAULT_GOOGLE_MODEL = "gemini-3-flash-preview";

function getModel(
  provider: Provider,
  modelName: string,
  openRouterApiKey?: string,
  googleApiKey?: string
): LanguageModel {
  if (provider === "google") {
    if (!googleApiKey) {
      throw new Error("Google API Key not found. Please set it in the extension popup.");
    }
    const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
    return google(modelName || DEFAULT_GOOGLE_MODEL);
  } else {
    if (!openRouterApiKey) {
      throw new Error("OpenRouter API Key not found. Please set it in the extension popup.");
    }
    console.log({ openRouterApiKey })
    const openRouter = createOpenRouter({ apiKey: openRouterApiKey });
    return openRouter(modelName || DEFAULT_OPENROUTER_MODEL);
  }
}

export async function generateReply(context: ConversationContext): Promise<string> {
  console.log("\n========== [DEBUG] generateReply() STARTED ==========");
  console.log("[DEBUG] Timestamp:", new Date().toISOString());

  console.log("[DEBUG] Step 1: Fetching state from storage...");
  const stateStartTime = performance.now();
  const state = await getState();
  console.log(`[DEBUG] Step 1 COMPLETE: State fetched in ${(performance.now() - stateStartTime).toFixed(2)}ms`);
  console.log("[DEBUG] State keys:", Object.keys(state));

  const provider = state.provider || "openrouter";
  const openRouterApiKey = state.openRouterApiKey;
  const googleApiKey = state.googleApiKey;
  const modelName =
    provider === "google"
      ? state.googleModel || DEFAULT_GOOGLE_MODEL
      : state.openRouterModel || DEFAULT_OPENROUTER_MODEL;
  const useMemory = state.useMemory;
  const memoryApiKey = state.memoryApiKey;
  const memoryProjectId = state.memoryProjectId;
  const selectedPromptId = state.selectedPromptId;
  const injectInSystemPrompts = state.injectInSystemPrompts;

  console.log("[DEBUG] Configuration:", {
    provider,
    modelName,
    useMemory,
    hasMemoryApiKey: !!memoryApiKey,
    selectedPromptId,
  });

  const model = getModel(provider, modelName, openRouterApiKey, googleApiKey);

  if (!context.mainTweet) {
    throw new Error("No main tweet found to reply to.");
  }

  const prompt = constructPrompt(context);

  const userContent: UserContent = [
    {
      type: "text",
      text: prompt,
    },
  ];

  if (state.useImageUnderstanding && context.mainTweet.images.length > 0) {
    context.mainTweet.images.forEach((imageUrl) => {
      userContent.push({
        type: "image",
        image: imageUrl,
      });
    });
  }

  try {
    console.log("[DEBUG] Step 2: Fetching stored replies from storage...");
    const repliesStartTime = performance.now();
    const storedReplies = await getStoredReplies();
    console.log(`[DEBUG] Step 2 COMPLETE: Stored replies fetched in ${(performance.now() - repliesStartTime).toFixed(2)}ms`);
    console.log(`[DEBUG] Found ${storedReplies.length} stored replies`);

    console.log("[DEBUG] Step 3: Generating system prompt...");
    const promptStartTime = performance.now();
    const systemContent = generateSystemPrompt(context.userInstructions, useMemory, storedReplies, selectedPromptId, injectInSystemPrompts);
    console.log(`[DEBUG] Step 3 COMPLETE: System prompt generated in ${(performance.now() - promptStartTime).toFixed(2)}ms`);
    console.log(`[DEBUG] System prompt length: ${systemContent.length} chars`);

    let text: string;

    console.log("[DEBUG] Step 4: Calling LLM API...");
    console.log(`[DEBUG] Provider: ${provider}, Model: ${modelName}`);
    const llmStartTime = performance.now();

    const result = await generateText({
      model,
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'low',
            includeThoughts: false,
          },
        } satisfies GoogleGenerativeAIProviderOptions,
      },
      temperature: 0.7,
    });

    console.log(`[DEBUG] Step 4 COMPLETE: LLM API responded in ${(performance.now() - llmStartTime).toFixed(2)}ms`);
    console.log("[DEBUG] LLM result usage:", result.usage);

    text = result.text;
    console.log(`[DEBUG] Generated reply length: ${text.length} chars`);
    console.log("========== [DEBUG] generateReply() FINISHED ==========\n");

    return text.trim();
  } catch (error) {
    console.error("Error generating reply:", error);
    throw error;
  }
}

