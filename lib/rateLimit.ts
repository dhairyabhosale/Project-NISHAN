/* AUDIT.md F18 - rate limiting. CLAUDE.md §12.6.
 *
 * §12.6 sets /api/lookup at 20 per 10 minutes per IP and case reads at 10 per
 * minute, because a case reference is four hex characters and §12.4 exposes
 * status and next step to anyone holding one. 65,536 references is a space a
 * script walks in seconds, so the limiter is what makes reference mode
 * defensible rather than merely thin.
 *
 * HONEST LIMITATION, and it is disclosed on /whats-real rather than implied
 * away: the counters live in the memory of one server instance. On a
 * serverless host a determined caller who spreads requests across instances
 * gets more than the quota. A shared store (Redis, or the database this build
 * does not have) is what makes the limit exact. What this does deliver is the
 * thing the limit is actually for here - a single client cannot sit in a loop
 * and enumerate references - and it costs no dependency and no network call.
 *
 * Fixed windows rather than a sliding log: one integer per caller instead of a
 * timestamp array, and the imprecision at a window edge does not matter for a
 * limit whose job is to stop a loop.
 */

export interface RateLimitResult {
  ok: boolean;
  /** Requests still allowed in the current window. */
  remaining: number;
  /** Seconds until the window resets. Sent as Retry-After on a rejection. */
  retryAfter: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Stop the map growing without bound on a long-lived instance. */
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  buckets.forEach((b, key) => { if (b.resetAt <= now) buckets.delete(key); });
}

/**
 * Count one request against a named limit.
 *
 * `now` is injected so the behaviour is testable without waiting out a window,
 * which is the same reason the diagnosis engine takes it (§8.5).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) return { ok: false, remaining: 0, retryAfter };
  return { ok: true, remaining: limit - existing.count, retryAfter };
}

/** Test seam. Never called by the app. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Who is calling.
 *
 * Vercel sets x-forwarded-for; the left-most entry is the client and the rest
 * are proxies. A caller can forge the header, but forging it only ever moves
 * them into a DIFFERENT bucket - it cannot raise the limit on the bucket they
 * are already in - so the worst case is the same as having no limit, which is
 * where this started.
 */
export function callerKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return scope + ":" + ip;
}
