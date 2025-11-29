import dayjs from "dayjs";
import { classifyCreateTweetPayload, parseCreateTweetRequestBody } from "../lib/tweetClassifier";
import {
  increment,
  millisUntilNextLocalMidnight,
  resetForDate,
  ensureStateInitialized,
  getState,
} from "../lib/storage";

// `browser` global type is provided by WXT; remove `any` declarations to use the typed API

export default defineBackground(() => {
  console.log("Background started", { id: browser?.runtime?.id });

  // Ensure state exists
  (async () => {
    try {
      await ensureStateInitialized();
      const s = await getState();
      console.log("TweetReply state:", s);
    } catch (e) {
      console.warn("Failed to ensure initial state", e);
    }
  })();

  // Register webRequest listener to inspect CreateTweet XHRs
  try {
    browser.webRequest.onBeforeRequest.addListener(
      (details) => {
        try {
          if (details.method !== "POST") return;
          if (!/CreateTweet/i.test(details.url)) return;
          let payload: any = null;
          const rb = details.requestBody;
          if (rb) {
            if (rb.raw && Array.isArray(rb.raw) && rb.raw.length > 0 && rb.raw[0].bytes) {
              const bytes = new Uint8Array(rb.raw[0].bytes);
              const text = new TextDecoder("utf-8").decode(bytes);
              payload =
                parseCreateTweetRequestBody(text) || parseCreateTweetRequestBody(JSON.parse(text));
            } else if (rb.formData) {
              payload = parseCreateTweetRequestBody(rb);
            } else if (typeof rb === "object") {
              payload = parseCreateTweetRequestBody(rb);
            }
          }
          const kind = classifyCreateTweetPayload(payload);
          console.log({ kind });
          if (kind === "tweet") increment("tweet").catch((e) => console.error(e));
          else if (kind === "reply") increment("reply").catch((e) => console.error(e));
        } catch (e) {
          console.error("Error parsing CreateTweet XHR", e);
        }
        return undefined;
      },
      { urls: ["*://*.twitter.com/*", "*://*.x.com/*"], types: ["xmlhttprequest"] },
      ["requestBody"]
    );
  } catch (err) {
    console.warn("Could not register webRequest listener, possibly due to permissions", err);
  }

  // Schedule midnight reset: first at next local midnight, then daily
  try {
    const delay = millisUntilNextLocalMidnight();
    // Create initial alarm to run at next midnight; we use a 24h period to repeat
    browser.alarms.create("midnightReset", { when: Date.now() + delay, periodInMinutes: 24 * 60 });
    browser.alarms.onAlarm.addListener(async (alarm: any) => {
      if (alarm?.name === "midnightReset") {
        console.log("midnightReset alarm fired, rolling history and resetting today");
        try {
          await resetForDate(dayjs().format("YYYY-MM-DD"));
        } catch (e) {
          console.error("Failed to reset for midnight", e);
        }
      }
    });
  } catch (err) {
    console.warn("Could not schedule alarm, check alarms permission", err);
  }

  // Setup onInstalled -> seed state if needed
  try {
    browser.runtime.onInstalled.addListener(async () => {
      try {
        await ensureStateInitialized();
        console.log("State ensured on install");
      } catch (e) {
        console.error("Failed to ensure state on install", e);
      }
    });
  } catch (err) {
    // ignore if not available
  }
});
