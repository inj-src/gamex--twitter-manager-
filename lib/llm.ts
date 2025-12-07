import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { ConversationContext } from "./extract";
import { getState } from "./storage";
import { generateSystemPrompt } from "./generateSystemPrompt";

const DEFAULT_MODEL = "moonshotai/kimi-k2:free"; // Cost-effective and fast
const VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";

export async function generateReply(context: ConversationContext): Promise<string> {
  const state = await getState();
  const apiKey = state.openRouterApiKey;
  const modelName = state.llmModel || DEFAULT_MODEL;

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
    const { text } = await generateText({
      model: openRouter(modelName),
      messages: [
        {
          role: "system",
          content: generateSystemPrompt(context.userInstructions),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

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

  const content: any[] = [
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
          content: content,
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

function constructPrompt(context: ConversationContext, imageDescription: string = ""): string {
  let prompt = `Main Tweet by ${context.mainTweet?.authorName} (@${context.mainTweet?.authorHandle}):\n"${context.mainTweet?.text}"\n`;

  if (context.mainTweet?.images.length) {
    prompt += `[Attached Images: ${context.mainTweet.images.length}]\n`;
  }

  if (imageDescription) {
    prompt += `[Image Description: ${imageDescription}]\n`;
  }

  if (context.replies.length > 0) {
    prompt += "\nExisting Replies:\n";
    context.replies.forEach((reply) => {
      prompt += `- ${reply.authorName} (@${reply.authorHandle}): "${reply.text}"\n`;
    });
  }

  prompt += "\nGenerate a reply to the main tweet.";
  return prompt;
}
