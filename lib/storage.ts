import dayjs from "dayjs";
import type { State, DailyCounts, CounterType } from "./types.ts";
import { DEFAULT_TARGETS } from "./types.ts";

// Use typed `browser` global provided by WXT; remove manual declarations

const STORAGE_KEY = "tweetReplyState";

const DEFAULT_STATE: State = {
  daily: {
    date: dayjs().format("YYYY-MM-DD"),
    tweets: 0,
    replies: 0,
  },
  history: {},
  targets: DEFAULT_TARGETS,
};

function wrapGet<T>(key?: string): Promise<T> {
  return new Promise((resolve) => {
    browser.storage.local.get(key || STORAGE_KEY).then((res: Record<string, any>) => {
      resolve(res[key || STORAGE_KEY]);
    });
  });
}

function wrapSet(obj: any): Promise<void> {
  return new Promise((resolve) => {
    browser.storage.local.set(obj).then(() => resolve());
  });
}

export async function getState(): Promise<State> {
  const state = (await wrapGet<State>()) || DEFAULT_STATE;
  // If date mismatches, we should adapt (but do not mutate persistent state here)
  if (!state.daily || !state.daily.date) {
    state.daily = { ...DEFAULT_STATE.daily };
  }
  return state;
}

export async function setState(state: State): Promise<void> {
  await wrapSet({ [STORAGE_KEY]: state });
  try {
    browser.runtime.sendMessage({ type: "stateChanged", state });
  } catch (e) {
    // ignore
  }
}

export async function ensureStateInitialized(): Promise<void> {
  const state = await getState();
  // If missing or malformed, set defaults
  if (!state || !state.daily || !state.daily.date) {
    await setState(DEFAULT_STATE);
    return;
  }
  // Ensure targets exist
  if (!state.targets) {
    state.targets = DEFAULT_TARGETS;
    await setState(state);
  }
}

export async function increment(type: CounterType): Promise<void> {
  const state = await getState();
  const today = dayjs().format("YYYY-MM-DD");
  if (state.daily.date !== today) {
    // If the stored day is not today, roll it into history and reset
    state.history = {
      ...state.history,
      [state.daily.date]: { tweets: state.daily.tweets, replies: state.daily.replies },
    };
    state.daily = { date: today, tweets: 0, replies: 0 };
  }
  if (type === "tweet") state.daily.tweets += 1;
  else state.daily.replies += 1;
  await setState(state);
}

export async function setTargets(tweets: number, replies: number): Promise<void> {
  const state = await getState();
  state.targets = { tweets, replies };
  await setState(state);
}

export async function resetForDate(date?: string): Promise<void> {
  const state = await getState();
  const newDate = date || dayjs().format("YYYY-MM-DD");
  // if state.daily is set and represents a different date, push it into history
  if (state.daily && state.daily.date && state.daily.date !== newDate) {
    state.history = {
      ...state.history,
      [state.daily.date]: { tweets: state.daily.tweets, replies: state.daily.replies },
    };
  }
  // seed a fresh day with newDate
  state.daily = { date: newDate, tweets: 0, replies: 0 };
  await setState(state);
}

// find next local midnight
export function millisUntilNextLocalMidnight(): number {
  const now = dayjs();
  const next = now.add(1, "day").startOf("day");
  return next.valueOf() - now.valueOf();
}
