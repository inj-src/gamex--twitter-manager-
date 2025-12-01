import { OpenRouter } from "@openrouter/sdk";
import { ConversationContext } from "./extract";
import { getState } from "./storage";

const MODEL = "google/gemini-2.0-flash-001"; // Cost-effective and fast

export async function generateReply(context: ConversationContext): Promise<string> {
  const state = await getState();
  const apiKey = state.openRouterApiKey;

  if (!apiKey) {
    throw new Error("OpenRouter API Key not found. Please set it in the extension popup.");
  }

  if (!context.mainTweet) {
    throw new Error("No main tweet found to reply to.");
  }

  const openRouter = new OpenRouter({
    apiKey: apiKey,
  });

  const prompt = constructPrompt(context);

  try {
    const completion = await openRouter.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful social media assistant. Generate a relevant, engaging, and concise reply to the main tweet, taking into account the context of the conversation and existing replies. Keep the tone casual but professional. Do not use hashtags unless necessary. The reply should be short, under 280 characters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating reply:", error);
    throw error;
  }
}

function constructPrompt(context: ConversationContext): string {
  let prompt = `Main Tweet by ${context.mainTweet?.authorName} (@${context.mainTweet?.authorHandle}):\n"${context.mainTweet?.text}"\n`;

  if (context.mainTweet?.images.length) {
    prompt += `[Attached Images: ${context.mainTweet.images.length}]\n`;
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
