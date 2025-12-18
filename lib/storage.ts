// TODO: The storage module needs refactoring

import dayjs from "dayjs";
import type { State, DailyCounts, CounterType, StoredReply, Provider } from "./types.ts";
import { DEFAULT_TARGETS } from "./types.ts";

// Use typed `browser` global provided by WXT; remove manual declarations

const CORE_STATE_KEY = "coreState";
const STORED_REPLIES_KEY = "storedReplies";
const LEGACY_STORAGE_KEY = "tweetReplyState";

const DEFAULT_STATE: State = {
  daily: {
    date: dayjs().format("YYYY-MM-DD"),
    tweets: 0,
    replies: 0,
    seconds: 0,
  },
  history: {},
  targets: DEFAULT_TARGETS,
  useImageUnderstanding: false,
  useMemory: false,
  selectedPromptId: "sigma-ragebait",
  openRouterModel: "moonshotai/kimi-k2:free",
  googleModel: "gemini-3-flash-preview",
};

async function getStorageItem<T>(key: string): Promise<T | undefined> {
  const res = await browser.storage.local.get(key);
  return res[key];
}

async function setStorageItem(key: string, value: any): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

/**
 * Migration logic from the old single-key storage to the new multi-key storage.
 */
async function migrateIfNeeded(): Promise<void> {
  const legacy = await getStorageItem<any>(LEGACY_STORAGE_KEY);
  if (legacy) {
    const { storedReplies, ...coreState } = legacy;
    
    // Save to new keys if they don't exist yet
    const existingCore = await getStorageItem(CORE_STATE_KEY);
    if (!existingCore) {
      await setStorageItem(CORE_STATE_KEY, coreState);
    }
    
    const existingReplies = await getStorageItem(STORED_REPLIES_KEY);
    if (!existingReplies) {
      await setStorageItem(STORED_REPLIES_KEY, storedReplies || []);
    }
    
    // Clean up legacy key
    await browser.storage.local.remove(LEGACY_STORAGE_KEY);
  }
}

export async function getState(): Promise<State> {
  console.log("[DEBUG][Storage] getState() called");
  await migrateIfNeeded();
  const stored = await getStorageItem<State>(CORE_STATE_KEY);
  if (!stored) {
    console.log("[DEBUG][Storage] No stored state found, returning default");
    return { ...DEFAULT_STATE };
  }

  // Merge with default to ensure structure
  const state = { ...DEFAULT_STATE, ...stored };

  // Ensure daily object exists
  if (!state.daily || !state.daily.date) {
    state.daily = { ...DEFAULT_STATE.daily };
  }
  // Ensure targets exist
  if (!state.targets) {
    state.targets = DEFAULT_TARGETS;
  }

  // Handle migration from llmModel to provider-specific models
  if ((stored as any).llmModel) {
    if (!state.openRouterModel) {
      state.openRouterModel = (stored as any).llmModel;
    }
  }

  // Ensure defaults for models if not set
  if (!state.openRouterModel) state.openRouterModel = DEFAULT_STATE.openRouterModel;
  if (!state.googleModel) state.googleModel = DEFAULT_STATE.googleModel;

  console.log("[DEBUG][Storage] getState() returning stored state");
  return state;
}

export async function setState(state: State): Promise<void> {
  await setStorageItem(CORE_STATE_KEY, state);
  try {
    browser.runtime.sendMessage({ type: "stateChanged", state }).catch(() => {});
  } catch (e) {
    // ignore errors if runtime is not available
  }
}

export async function ensureStateInitialized(): Promise<void> {
  const state = await getState();
  await setState(state);
}

/**
 * Checks if the state's date matches the target date.
 * If not, moves current daily counts to history and resets daily counts for the new date.
 * Returns true if rollover occurred.
 */
function rolloverDateIfNeeded(state: State, targetDate: string): boolean {
  if (state.daily.date !== targetDate) {
    state.history = {
      ...state.history,
      [state.daily.date]: { ...state.daily },
    };
    state.daily = { date: targetDate, tweets: 0, replies: 0, seconds: 0 };
    return true;
  }
  return false;
}

export async function increment(type: CounterType): Promise<void> {
  const state = await getState();
  const today = dayjs().format("YYYY-MM-DD");

  rolloverDateIfNeeded(state, today);

  if (type === "tweet") {
    state.daily.tweets += 1;
  } else {
    state.daily.replies += 1;
  }

  await setState(state);
}

export async function addSeconds(seconds: number): Promise<void> {
  const state = await getState();
  const today = dayjs().format("YYYY-MM-DD");

  rolloverDateIfNeeded(state, today);

  // Ensure seconds is initialized (for migration)
  if (typeof state.daily.seconds !== "number") {
    state.daily.seconds = 0;
  }

  state.daily.seconds += seconds;
  await setState(state);
}

export async function setTargets(tweets: number, replies: number): Promise<void> {
  const state = await getState();
  state.targets = { tweets, replies };
  await setState(state);
}

export async function setProvider(provider: Provider): Promise<void> {
  const state = await getState();
  state.provider = provider;
  await setState(state);
}

export async function setOpenRouterApiKey(apiKey: string): Promise<void> {
  const state = await getState();
  state.openRouterApiKey = apiKey;
  await setState(state);
}

export async function setGoogleApiKey(apiKey: string): Promise<void> {
  const state = await getState();
  state.googleApiKey = apiKey;
  await setState(state);
}

export async function setOpenRouterModel(model: string): Promise<void> {
  const state = await getState();
  state.openRouterModel = model;
  await setState(state);
}

export async function setGoogleModel(model: string): Promise<void> {
  const state = await getState();
  state.googleModel = model;
  await setState(state);
}

export async function resetForDate(date?: string): Promise<void> {
  const state = await getState();
  const newDate = date || dayjs().format("YYYY-MM-DD");

  const rolledOver = rolloverDateIfNeeded(state, newDate);

  if (!rolledOver) {
    // If we are on the same date, just reset the counts
    state.daily.tweets = 0;
    state.daily.replies = 0;
    state.daily.seconds = 0;
  }

  await setState(state);
}

export async function setUseImageUnderstanding(useImageUnderstanding: boolean): Promise<void> {
  const state = await getState();
  state.useImageUnderstanding = useImageUnderstanding;
  await setState(state);
}

export async function setMemoryApiKey(apiKey: string): Promise<void> {
  const state = await getState();
  state.memoryApiKey = apiKey;
  await setState(state);
}

export async function setMemoryProjectId(projectId: string): Promise<void> {
  const state = await getState();
  state.memoryProjectId = projectId;
  await setState(state);
}

export async function setUseMemory(useMemory: boolean): Promise<void> {
  const state = await getState();
  state.useMemory = useMemory;
  await setState(state);
}

export async function setSelectedPromptId(promptId: string): Promise<void> {
  const state = await getState();
  state.selectedPromptId = promptId;
  await setState(state);
}

// find next local midnight
export function millisUntilNextLocalMidnight(): number {
  const now = dayjs();
  const next = now.add(1, "day").startOf("day");
  return next.diff(now);
}

export async function addStoredReply(reply: StoredReply): Promise<void> {
  const replies = await getStoredReplies();
  replies.push(reply);
  await setStorageItem(STORED_REPLIES_KEY, replies);
}

export async function getStoredReplies(): Promise<StoredReply[]> {
  console.log("[DEBUG][Storage] getStoredReplies() called");
  await migrateIfNeeded();
  const replies = await getStorageItem<StoredReply[]>(STORED_REPLIES_KEY);
  console.log(`[DEBUG][Storage] getStoredReplies() returning ${replies?.length || 0} replies`);
  return replies || [];
}
