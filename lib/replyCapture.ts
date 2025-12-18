import { nanoid } from "nanoid";
import { addStoredReply } from "./storage";
import type { StoredReply } from "./types";
import { extractTweetData, TweetContent } from "./extract";

/**
 * Captures and stores a reply with proper type classification
 */
export async function captureReply(
  originalTweet: TweetContent,
  reply: string,
  aiGeneratedReply?: string
): Promise<void> {
  // Determine the reply type
  let type: StoredReply["type"];

  if (!aiGeneratedReply) {
    // No AI reply was generated, this is a manual reply
    type = "manual";
  } else if (reply === aiGeneratedReply) {
    // AI reply was used as-is
    type = "ai-unmodified";
  } else {
    // AI reply was modified by user
    type = "ai-modified";
  }

  const storedReply: StoredReply = {
    id: nanoid(),
    timestamp: Date.now(),
    originalTweet: {
      authorHandle: originalTweet.authorHandle,
      text: originalTweet.text,
    },
    reply,
    type,
    ...(type === "ai-modified" && { aiGeneratedReply }),
  };

  console.log("Capturing reply:", storedReply);
  await addStoredReply(storedReply);
}

/**
 * Extracts the main tweet from the conversation timeline
 */
function extractMainTweet(): TweetContent | null {
  const conversation = document.querySelector('div[aria-label="Timeline: Conversation"]');
  if (!conversation) return null;

  const mainTweetElement = conversation.querySelector('article[data-testid="tweet"]');
  if (!mainTweetElement) return null;

  return extractTweetData(mainTweetElement);
}

/**
 * Extracts the reply text from the reply input area
 */
function extractReplyText(): string {
  const replyTextElement = document.querySelector(
    'div[data-testid="inline_reply_offscreen"] span[data-text="true"]'
  );
  return replyTextElement ? (replyTextElement as HTMLElement).innerText.trim() : "";
}

/**
 * Sets up the send button listener to capture replies
 */
export function setupReplyCaptureListener(): void {
  // Use event delegation on body for dynamically added send buttons
  document.body.addEventListener(
    "click",
    async (e) => {
      const target = e.target as HTMLElement;
      const sendButton = target.closest('[data-testid="tweetButtonInline"]') as HTMLElement | null;

      if (!sendButton) return;

      // Find the reply container
      const replyContainer = document.querySelector(
        'div[data-testid="inline_reply_offscreen"]'
      ) as HTMLElement | null;

      if (!replyContainer) {
        console.log("Reply container not found");
        return;
      }

      // Get the AI generated reply if it exists
      const aiGeneratedReply = replyContainer.getAttribute("data-ai-generated-reply") || undefined;

      // Extract the reply text
      const replyText = extractReplyText();
      if (!replyText) {
        console.log("No reply text found");
        return;
      }

      // Extract the original tweet data
      const originalTweet = extractMainTweet();
      if (!originalTweet) {
        console.log("Could not extract main tweet data");
        return;
      }

      // Capture the reply
      await captureReply(originalTweet, replyText, aiGeneratedReply);

      // Clear the AI generated reply attribute after capturing
      replyContainer.removeAttribute("data-ai-generated-reply");
    },
    true // Use capture phase to run before Twitter's handlers
  );

  console.log("Reply capture listener initialized");
}
