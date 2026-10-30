import type { NextRequest } from "next/server";

/**
 * Lightweight in-memory rate limiting (best effort — serverless instances
 * each keep their own counters; enough as a lightweight anti-spam control).
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    // Prune occasionally to avoid unbounded growth.
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return true;
}

/** Scope + IP for rate-limit keys. */
export function clientKey(req: NextRequest, scope: string): string {
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    "unknown";
  return `${scope}:${ip}`;
}
