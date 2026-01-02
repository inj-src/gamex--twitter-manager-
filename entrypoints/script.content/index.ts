import { extractConversationContext } from "@/lib/extract";
import { generateReply } from "@/lib/llm";
import { setupReplyCaptureListener } from "@/lib/replyCapture";
import { getState } from "@/lib/storage";

export default defineContentScript({
  matches: ["*://*.x.com/*"],
  main() {
    console.log("X-Tracker content script loaded.");

    // Initialize reply capture listener
    setupReplyCaptureListener();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const tweetControlGroups = document.querySelectorAll('div[role="group"]');
          tweetControlGroups.forEach((group) => {
            if (group.querySelector('[data-testid="ai-reply-button"]')) return;
            if (!window.location.href.includes("/status/")) {
              group.querySelector('[data-testid="ai-reply-button"]')?.remove();
              return;
            }

            // Check if this is a tweet action bar (has reply, retweet, like buttons)
            const hasReply = group.querySelector('[data-testid="reply"]');
            const hasLike = group.querySelector('[data-testid="like"]');
            const hasRetweet = group.querySelector('[data-testid="retweet"]');

            if (hasReply && hasLike && hasRetweet) {
              injectAIButton(group as HTMLElement);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
});

function injectAIButton(group: HTMLElement) {
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "css-175oi2r r-18u37iz r-1h0z5md r-13awgt0";

  const button = document.createElement("button");
  button.setAttribute("aria-label", "AI Reply");
  button.setAttribute("role", "button");
  button.className =
    "css-175oi2r r-1777fci r-bt1l66 r-bztko3 r-lrvibr r-1loqt21 r-1ny4l3l ai-reply-button";
  button.setAttribute("data-testid", "ai-reply-button");
  button.type = "button";

  const chatBotIcon = `
    <div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q ai-reply-content" style="color: rgb(83, 100, 113);">
      <div class="css-175oi2r r-xoduu5">
        <div class="css-175oi2r r-xoduu5 r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-1niwhzg r-sdzlij r-xf4iuw r-o7ynqc r-6416eg r-1ny4l3l ai-reply-bg"></div>
        <svg aria-hidden="true" class="r-4qtqp9 r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-50lct3 r-1srniue" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V2H8"/><path d="M15 11v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M9 11v2"/></svg>
      </div>
    </div>
  `;

  const spinnerIcon = `
    <div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q" style="color: rgb(29, 155, 240); cursor: auto;">
      <div class="css-175oi2r r-xoduu5">
        <svg aria-hidden="true" class="r-4qtqp9 r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-50lct3 r-1srniue" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>
        </svg>
      </div>
    </div>
  `;

  button.innerHTML = chatBotIcon;

  button.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("\n##################################################");
    console.log("[DEBUG][Content] AI Reply button clicked!");
    console.log("[DEBUG][Content] Starting reply generation flow...");
    console.log("##################################################\n");

    // New Spinner SVG
    try {
      // Loading state
      button.innerHTML = spinnerIcon;

      // 1. Extract context
      console.log("[DEBUG][Content] Extracting conversation context...");
      const context = extractConversationContext();
      console.log("[DEBUG][Content] Context extracted:", {
        hasMainTweet: !!context.mainTweet,
        repliesCount: context.replies.length,
        hasUserInstructions: !!context.userInstructions,
      });

      // 2. Generate reply
      console.log("[DEBUG][Content] Calling generateReply()...");
      const replyStartTime = performance.now();
      const reply = await generateReply(context);
      console.log(`[DEBUG][Content] Reply generated in ${(performance.now() - replyStartTime).toFixed(2)}ms`);
      console.log("[DEBUG][Content] Generated reply:", reply);

      // Get the container for storing AI generated reply attribute
      const replyContainer = document.querySelector(
        'div[data-testid="inline_reply_offscreen"]'
      ) as HTMLElement;

      const replyElement = document.querySelector(
        'div[data-testid="inline_reply_offscreen"] .DraftEditor-root'
      ) as HTMLElement;

      if (replyElement) {
        replyElement.click();

        // Store AI reply and prompt ID for comparison when user sends
        if (replyContainer) {
          replyContainer.setAttribute("data-ai-generated-reply", reply);
          const state = await getState();
          if (state.selectedPromptId) {
            replyContainer.setAttribute("data-ai-prompt-id", state.selectedPromptId);
          }
        }

        // tiny delay for the system to respond
        await new Promise((resolve) => setTimeout(resolve, 300));
        document.execCommand("insertText", false, reply);
      } else {
        console.error("Could not find tweet input area");
      }
    } catch (error) {
      console.error("AI Reply failed:", error);
      alert("Failed to generate reply. Please check your API key in the extension popup.");
    } finally {
      // Reset state
      button.innerHTML = chatBotIcon;
    }
  });

  // Add spin keyframes if not present
  if (!document.getElementById("ai-reply-styles")) {
    const style = document.createElement("style");
    style.id = "ai-reply-styles";
    style.innerHTML = `
        @keyframes spin { 
            100% { transform: rotate(360deg); } 
        }
        .ai-reply-bg {
          transition-property: background-color, box-shadow;
          transition-duration: 0.2s;
        }
        .ai-reply-content {
          transition-property: color;
          transition-duration: 0.2s;
        }
        .ai-reply-button:hover .ai-reply-bg {
          background-color: rgba(29, 155, 240, 0.1);
        }
        .ai-reply-button:hover .ai-reply-content {
          color: rgb(29, 155, 240) !important;
        }
      `;
    document.head.appendChild(style);
  }

  buttonContainer.appendChild(button);
  group.prepend(buttonContainer);
}
