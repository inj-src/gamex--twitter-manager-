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

  // Initialize state on startup
  initializeState();

  // Register listeners
  registerWebRequestListeners();
  registerAlarmListeners();
  registerInstallListeners();
});

async function initializeState() {
  try {
    await ensureStateInitialized();
    const s = await getState();
    console.log("TweetReply state:", s);
  } catch (e) {
    console.warn("Failed to ensure initial state", e);
  }
}

function registerWebRequestListeners() {
  try {
    browser.webRequest.onBeforeRequest.addListener(
      handleCreateTweetRequest,
      { urls: ["*://*.twitter.com/*", "*://*.x.com/*"], types: ["xmlhttprequest"] },
      ["requestBody"]
    );
  } catch (err) {
    console.warn("Could not register webRequest listener, possibly due to permissions", err);
  }
}

function handleCreateTweetRequest(details: any) {
  try {
    if (details.method !== "POST") return;
    if (!/CreateTweet/i.test(details.url)) return;

    const payload = extractPayload(details.requestBody);
    const kind = classifyCreateTweetPayload(payload);

    console.log({ kind });

    if (kind !== "unknown") {
      increment(kind).catch((e) => console.error(e));
    }
  } catch (e) {
    console.error("Error parsing CreateTweet XHR", e);
  }
  return undefined;
}

function extractPayload(rb: any): any {
  if (!rb) return null;

  if (rb.raw && Array.isArray(rb.raw) && rb.raw.length > 0 && rb.raw[0].bytes) {
    const bytes = new Uint8Array(rb.raw[0].bytes);
    const text = new TextDecoder("utf-8").decode(bytes);
    try {
      return parseCreateTweetRequestBody(text) || parseCreateTweetRequestBody(JSON.parse(text));
    } catch {
      return parseCreateTweetRequestBody(text);
    }
  }

  if (rb.formData || typeof rb === "object") {
    return parseCreateTweetRequestBody(rb);
  }

  return null;
}

function registerAlarmListeners() {
  try {
    const delay = millisUntilNextLocalMidnight();
    browser.alarms.create("midnightReset", {
      when: Date.now() + delay,
      periodInMinutes: 24 * 60,
    });

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
}

function registerInstallListeners() {
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
}
