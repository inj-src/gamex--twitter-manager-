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
    const openRouter = createOpenRouter({ apiKey: openRouterApiKey });
    return openRouter(modelName || DEFAULT_OPENROUTER_MODEL);
  }
}

export async function generateReply(context: ConversationContext): Promise<string> {
  const state = await getState();
  console.log("[LLM] Current state extracted:", state);
  const provider = state.provider || "openrouter";
  const openRouterApiKey = state.openRouterApiKey;
  const googleApiKey = state.googleApiKey;
  const modelName = state.llmModel || (provider === "google" ? DEFAULT_GOOGLE_MODEL : DEFAULT_OPENROUTER_MODEL);
  const useMemory = state.useMemory;
  const memoryApiKey = state.memoryApiKey;
  const memoryProjectId = state.memoryProjectId;
  const selectedPromptId = state.selectedPromptId;

  console.log("[LLM] Using prompt ID:", selectedPromptId);

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
    const storedReplies = await getStoredReplies();
    const systemContent = generateSystemPrompt(context.userInstructions, useMemory, storedReplies, selectedPromptId);
    let text: string;

    console.log(systemContent)
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

    text = result.text;


    return text.trim();
  } catch (error) {
    console.error("Error generating reply:", error);
    throw error;
  }
}

