import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, UserContent } from "ai";
// import { streamText } from "ai";

import { searchMemoriesTool } from "@supermemory/tools/ai-sdk";
import { ConversationContext } from "./extract";
import { getState } from "./storage";
import { generateSystemPrompt } from "./generateSystemPrompt";
import { constructPrompt } from "./constructPrompt";

const DEFAULT_MODEL = "moonshotai/kimi-k2:free"; // Cost-effective and fast
const VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";

export async function generateReply(context: ConversationContext): Promise<string> {
  const state = await getState();
  const apiKey = state.openRouterApiKey;
  const modelName = state.llmModel || DEFAULT_MODEL;
  const useMemory = state.useMemory;
  const memoryApiKey = state.memoryApiKey;
  const memoryProjectId = state.memoryProjectId;

  if (!apiKey) {
    throw new Error("OpenRouter API Key not found. Please set it in the extension popup.");
  }

  if (!context.mainTweet) {
    throw new Error("No main tweet found to reply to.");
  }

  let imageDescription = "";
  if (state.useImageUnderstanding && context.mainTweet.images.length > 0) {
    try {
      imageDescription = await getImageDescription(context.mainTweet.images);
    } catch (error) {
      console.error("Failed to get image description, proceeding without it.", error);
    }
  }

  const openRouter = createOpenRouter({
    apiKey: apiKey,
  });

  const prompt = constructPrompt(context, imageDescription);

  console.log("Generating reply with prompt:", prompt);

  try {
    const systemContent = generateSystemPrompt(context.userInstructions, useMemory);
    let text: string;

    if (useMemory && memoryApiKey) {
      const result = await generateText({
        model: openRouter(modelName),
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        tools: {
          searchMemories: searchMemoriesTool(
            memoryApiKey,
            memoryProjectId ? { projectId: memoryProjectId } : undefined
          ),
        },
        // maxSteps: 2,
        temperature: 0.7,
      });
      text = result.text;
    } else {
      const result = await generateText({
        model: openRouter(modelName),
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });
      text = result.text;
    }

    return text.trim();
  } catch (error) {
    console.error("Error generating reply:", error);
    throw error;
  }
}

export async function getImageDescription(imageUrls: string[]): Promise<string> {
  const state = await getState();
  const apiKey = state.openRouterApiKey;

  if (!apiKey) {
    throw new Error("OpenRouter API Key not found. Please set it in the extension popup.");
  }

  if (imageUrls.length === 0) {
    return "";
  }

  const openRouter = createOpenRouter({
    apiKey: apiKey,
  });

  const content: UserContent = [
    {
      type: "text",
      text: "Describe the visual content and meaning of this image in a concise way.",
    },
  ];

  imageUrls.forEach((imageUrl) => {
    content.push({
      type: "image",
      image: imageUrl,
    });
  });

  console.log("Getting image description with content:", content);

  try {
    const { text } = await generateText({
      model: openRouter(VISION_MODEL),
      messages: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.5,
    });

    return text.trim();
  } catch (error) {
    console.error("Error getting image description:", error);
    throw error;
  }
}
