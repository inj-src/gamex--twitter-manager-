export type CounterType = "tweet" | "reply";

export interface DailyCounts {
  date: string; // YYYY-MM-DD
  tweets: number;
  replies: number;
  seconds: number;
}

export interface StoredReply {
  id: string; // Unique identifier (nanoid)
  timestamp: number; // When reply was made
  originalTweet: {
    authorHandle: string;
    text: string;
  };
  reply: string; // The actual reply sent
  type: "manual" | "ai-unmodified" | "ai-modified";
  aiGeneratedReply?: string; // Original AI reply (for modified type)
}

export interface State {
  daily: DailyCounts;
  history: Record<string, { tweets: number; replies: number; seconds: number }>;
  targets: { tweets: number; replies: number };
  openRouterApiKey?: string;
  llmModel?: string;
  useImageUnderstanding: boolean;
  memoryApiKey?: string;
  memoryProjectId?: string;
  useMemory: boolean;
}

export const DEFAULT_TARGETS = { tweets: 5, replies: 50 };

