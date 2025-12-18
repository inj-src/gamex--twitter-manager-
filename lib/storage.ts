// TODO: The storage module needs refactoring

import dayjs from "dayjs";
import type { State, DailyCounts, CounterType, StoredReply } from "./types.ts";
import { DEFAULT_TARGETS } from "./types.ts";

// Use typed `browser` global provided by WXT; remove manual declarations

const STORAGE_KEY = "tweetReplyState";

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
  storedReplies: [],
};

async function getStorageItem<T>(key: string): Promise<T | undefined> {
  const res = await browser.storage.local.get(key);
  return res[key];
}

async function setStorageItem(key: string, value: any): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

export async function getState(): Promise<State> {
  const stored = await getStorageItem<State>(STORAGE_KEY);
  if (!stored) return { ...DEFAULT_STATE };

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

  return state;
}

export async function setState(state: State): Promise<void> {
  await setStorageItem(STORAGE_KEY, state);
  try {
    browser.runtime.sendMessage({ type: "stateChanged", state }).catch(() => {});
  } catch (e) {
    // ignore errors if runtime is not available
  }
}

export async function ensureStateInitialized(): Promise<void> {
  const state = await getState();
  // getState already merges with defaults, so we just save it to persist any missing fields
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

  if (type === "tweet") state.daily.tweets += 1;
  else state.daily.replies += 1;

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

export async function setOpenRouterApiKey(apiKey: string): Promise<void> {
  const state = await getState();
  state.openRouterApiKey = apiKey;
  await setState(state);
}

export async function setLlmModel(llmModel: string): Promise<void> {
  const state = await getState();
  state.llmModel = llmModel;
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

// find next local midnight
export function millisUntilNextLocalMidnight(): number {
  const now = dayjs();
  const next = now.add(1, "day").startOf("day");
  return next.diff(now);
}

export async function addStoredReply(reply: StoredReply): Promise<void> {
  const state = await getState();
  if (!state.storedReplies) {
    state.storedReplies = [];
  }
  state.storedReplies.push(reply);
  await setState(state);
}

export async function getStoredReplies(): Promise<StoredReply[]> {
  const state = await getState();
  return state.storedReplies || [];
}
