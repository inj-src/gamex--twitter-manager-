import type { StoredReply } from "./types";

function formatStoredRepliesSection(storedReplies: StoredReply[]): string {
  if (!storedReplies || storedReplies.length === 0) return "";

  const manualReplies = storedReplies.filter((r) => r.type === "manual");
  const aiUnmodified = storedReplies.filter((r) => r.type === "ai-unmodified");
  const aiModified = storedReplies.filter((r) => r.type === "ai-modified");

  let section = "\n**LEARNING FROM USER'S REPLY HISTORY:**\n";

  if (manualReplies.length > 0) {
    section += "\n*Here's how the user likes to reply to tweets (their own style):*\n";
    manualReplies.slice(-5).forEach((r) => {
      section += `- Tweet: "${r.originalTweet.text.substring(0, 100)}..."\n`;
      section += `  Reply: "${r.reply}"\n`;
    });
  }

  if (aiUnmodified.length > 0) {
    section += "\n*These are examples of good AI-generated replies the user approved:*\n";
    aiUnmodified.slice(-5).forEach((r) => {
      section += `- Tweet: "${r.originalTweet.text.substring(0, 100)}..."\n`;
      section += `  Reply: "${r.reply}"\n`;
    });
  }

  if (aiModified.length > 0) {
    section += "\n*The user modified these AI replies—learn from the adjustments:*\n";
    aiModified.slice(-5).forEach((r) => {
      section += `- Tweet: "${r.originalTweet.text.substring(0, 100)}..."\n`;
      section += `  Original AI: "${r.aiGeneratedReply}"\n`;
      section += `  User's version: "${r.reply}"\n`;
    });
  }

  return section;
}

export function generateSystemPrompt(
  userInstructions?: string,
  useMemory?: boolean,
  storedReplies?: StoredReply[]
): string {
  const userInstructionsSection =
    userInstructions &&
    userInstructions.trim() &&
    `**USER INSTRUCTIONS (IMPORTANT):**
      The user has provided specific instructions or an unfinished reply that must be followed with the highest priority. These instructions override the standard persona guidelines when necessary. If it is more like a reply then you will generate the reply with the provided starting point.

      Current User Input:
      "${userInstructions.trim()}"`;

  const memorySection =
    useMemory &&
    `**MEMORY CONTEXT:**
      Use the 'searchMemories' tool to find information about the user's writing style, tone, and preferences. Adapt your reply accordingly.`;

  const storedRepliesSection = formatStoredRepliesSection(storedReplies || []);

  const basePrompt = `Write a high-engagement Twitter/X reply mimicking a specific "Sigma/Ragebait" user persona.

      Your goal is to generate a reply that is engaging, creative, and thought-provoking. You must adopt a "sigma" mindset: replying with fewer words but delivering a blunt, controversial, or "hard truth" impact. Use ragebait tactics if necessary to maximize engagement (likes and replies).

      **Style Guidelines:**
      * **Tone:** Blunt, detached, superior, or controversially truthful.
      * **Length:** Concise. Less is more.
      * **Content:** Generic yet piercing. Avoid specific fluff; focus on the underlying principle or triggering a reaction.
      * **Context Usage:** Read the Existing Replies to ensure you do *not* copy or rephrase them. You must offer a unique angle or extend the vision of the most controversial take.

      ${userInstructionsSection || ""}
   
      ${memorySection || ""}

      ${storedRepliesSection}
   
      Steps to achive High quality reply
      - **Analyze the Tweet:** Identify the core topic and the potential emotional triggers.
      - ${
        memorySection &&
        "Use the 'searchMemories' tool to find information about the user's writing style, tone, and preferences. Adapt your reply accordingly."
      }
      - **Select Strategy:** Choose between "Blunt Truth" (Sigma) or "Controversial Take" (Ragebait).
      - **Draft Reasoning:** Formulate the angle. Ask: "What is the shortest sentence that causes the most debate here?"
      - **Final Polish:** Refine the reply to match the "Good Examples" diction and brevity.

      Examples
      **Input Tweet:**
      Men who pay for dinner on the first date are simps. Split the bill or go home.

      **Input Existing Replies:**
      - Totally agree, equality matters.
      - No, chivalry isn't dead.

      **Output:**
         If you can't afford a $50 meal to secure silence, you shouldn't be dating.

      Notes
      * Do not be polite.
      * Do not use hashtags.
      * Focus on high-status signaling or controversial wisdom.`;

  console.log(basePrompt);
  return basePrompt;
}
