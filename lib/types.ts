export type CounterType = "tweet" | "reply";

export interface DailyCounts {
  date: string; // YYYY-MM-DD
  tweets: number;
  replies: number;
}

export interface State {
  daily: DailyCounts;
  history: Record<string, { tweets: number; replies: number }>;
  targets: { tweets: number; replies: number };
}

export const DEFAULT_TARGETS = { tweets: 5, replies: 50 };
