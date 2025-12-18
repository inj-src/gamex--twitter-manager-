export interface TweetContent {
  authorName: string;
  authorHandle: string;
  text: string;
  images: string[];
}

export interface ConversationContext {
  mainTweet: TweetContent | null;
  replies: TweetContent[];
  userInstructions?: string;
}

export function extractConversationContext(): ConversationContext {
  const conversation = document.querySelector('div[aria-label="Timeline: Conversation"]');
  if (!conversation) {
    alert("Could not find conversation timeline.");
    return { mainTweet: null, replies: [] };
  }

  const tweets = Array.from(conversation.querySelectorAll('article[data-testid="tweet"]'));
  if (tweets.length === 0) return { mainTweet: null, replies: [] };

  // The first child is usually the main tweet
  const mainTweetElement = tweets[0];
  const mainTweet = extractTweetData(mainTweetElement);

  // The rest are replies
  const replies = tweets
    .slice(1)
    .map(extractTweetData)
    .filter((t): t is TweetContent => t !== null);

  // Extract user instructions from the inline reply input
  const userInstructionsElement = document.querySelector('div[data-testid="inline_reply_offscreen"] span[data-text="true"]');
  const userInstructions = userInstructionsElement ? (userInstructionsElement as HTMLElement).innerText.trim() : undefined;

  return {
    mainTweet,
    replies,
    userInstructions,
  };
}

export function extractTweetData(element: Element): TweetContent | null {
  // TODO: The tweet data extraction needs more attention
  // By using semantic HTML attributes or Twitter's internal data structures if accessible
  const tweetTextElement = element.querySelector('[data-testid="tweetText"]');
  const text = tweetTextElement ? (tweetTextElement as HTMLElement).innerText : "";

  const userElement = element.querySelector('[data-testid="User-Name"]');

  let authorName = "";
  let authorHandle = "";

  if (userElement) {
    // A more robust way to get handle is looking for the @ text
    const allText = (userElement as HTMLElement).innerText;
    const lines = allText.split("\n");
    if (lines.length >= 2) {
      authorName = lines[0];
      authorHandle = lines[1];
    }
  }

  const images = Array.from(element.querySelectorAll('img[src*="media"]'))
    .map((img) => (img as HTMLImageElement).src)
    .filter((src) => src.includes("format=")); // Filter for actual post images

  if (!text && images.length === 0) return null;

  return {
    authorName,
    authorHandle,
    text,
    images,
  };
}
