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

export type Provider = 'openrouter' | 'google';

export interface State {
  daily: DailyCounts;
  history: Record<string, { tweets: number; replies: number; seconds: number }>;
  targets: { tweets: number; replies: number };
  provider?: Provider;
  openRouterApiKey?: string;
  googleApiKey?: string;
  openRouterModel?: string;
  googleModel?: string;
  useImageUnderstanding: boolean;
  memoryApiKey?: string;
  memoryProjectId?: string;
  useMemory: boolean;
  selectedPromptId?: string;
}

export const DEFAULT_TARGETS = { tweets: 5, replies: 50 };

