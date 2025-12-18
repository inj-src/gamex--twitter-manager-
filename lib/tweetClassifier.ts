import type { CounterType } from "./types.ts";

/**
 * Classify the CreateTweet request payload as a tweet or reply.
 *
 * Returns 'tweet' if there is no `reply` object, 'reply' if it exists, else 'unknown'.
 */
export function classifyCreateTweetPayload(payload: any): CounterType | "unknown" {
  if (!payload || typeof payload !== "object") return "unknown";

  // Check for reply structure in variables
  if (payload.variables?.reply && typeof payload.variables.reply === "object") {
    return "reply";
  }

  // Default to tweet if valid payload but no reply indicator
  return "tweet";
}

/**
 * Try to parse a request body which may be either JSON string or FormData-like object.
 */
export function parseCreateTweetRequestBody(body: any): any | null {
  if (!body) return null;

  // Handle string input (JSON)
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  // Handle object input
  if (typeof body === "object") {
    // Handle FormData structure
    if (body.formData) {
      return parseFormData(body.formData);
    }
    // Already a parsed object
    return body;
  }

  return null;
}

function parseFormData(formData: Record<string, string[]>): any | null {
  const key = Object.keys(formData).find((k) => {
    const lower = k.toLowerCase();
    return lower.includes("variables") || lower.includes("payload");
  });

  if (key && formData[key]?.[0]) {
    try {
      return JSON.parse(formData[key][0]);
    } catch {
      return null;
    }
  }
  return null;
}
