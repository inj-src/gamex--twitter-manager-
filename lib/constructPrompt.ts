import { ConversationContext } from "./extract";

export function constructPrompt(
  context: ConversationContext,
  imageDescription: string = ""
): string {
  let prompt = `Main Tweet by ${context.mainTweet?.authorName} (@${context.mainTweet?.authorHandle}):\n${context.mainTweet?.text}\n`;

  if (context.mainTweet?.images.length) {
    prompt += `[Attached Images: ${context.mainTweet.images.length}]\n`;
  }

  if (imageDescription) {
    prompt += `[Image Description: ${imageDescription}]\n`;
  }

  if (context.replies.length > 0) {
    prompt += "\nExisting Replies:\n";
    context.replies.forEach((reply, index) => {
      prompt += `${index + 1}. ${reply.authorName} (${reply.authorHandle}): ${reply.text}\n`;
    });
  }

  prompt += "\nGenerate a reply to the main tweet.";
  return prompt;
}
