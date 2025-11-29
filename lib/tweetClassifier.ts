import type { CounterType } from "./types.ts";

/**
 * Classify the CreateTweet request payload as a tweet or reply.
 *
 * Returns 'tweet' if there is no `reply` object, 'reply' if it exists, else 'unknown'.
 */
export function classifyCreateTweetPayload(payload: any): CounterType | "unknown" {
  console.log(payload);
  if (!payload || typeof payload !== "object") return "unknown";
  if (payload.variables?.reply && typeof payload.variables.reply === "object") return "reply";
  return "tweet";
}

/**
 * Try to parse a request body which may be either JSON string or FormData-like object.
 */
export function parseCreateTweetRequestBody(body: any): any | null {
  // If body is already an object
  if (!body) return null;
  if (typeof body === "object") {
    // if body is a FormData-like map, it will have keys
    if (body.formData) {
      // formData is an object whose keys map to arrays
      // look for a key that contains JSON, attempt to parse
      const fid = Object.keys(body.formData).find(
        (k) => k.toLowerCase().includes("variables") || k.toLowerCase().includes("payload")
      );
      if (fid) {
        try {
          return JSON.parse(body.formData[fid][0]);
        } catch (e) {
          return null;
        }
      }
      return null;
    }
    // it's already an object representing the payload
    return body;
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (_) {
      return null;
    }
  }
  return null;
}
