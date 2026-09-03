/* AUDIT.md F18 - the rate limiter. §12.6.
 *
 * `now` is injected, so a ten-minute window is tested in microseconds rather
 * than by waiting. Same reason the diagnosis engine takes it (§8.5). */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { rateLimit, resetRateLimits, callerKey } from "../lib/rateLimit";

const WINDOW = 10 * 60 * 1000;

describe("F18 - rate limiting", () => {
  beforeEach(() => resetRateLimits());

  it("allows exactly the quota, then refuses", () => {
    const t = 1_000_000;
    for (let i = 1; i <= 20; i++) {
      assert.equal(rateLimit("k", 20, WINDOW, t).ok, true, "request " + i + " should pass");
    }
    assert.equal(rateLimit("k", 20, WINDOW, t).ok, false, "the 21st should be refused");
  });

  it("counts down remaining", () => {
    const t = 1_000_000;
    assert.equal(rateLimit("k", 3, WINDOW, t).remaining, 2);
    assert.equal(rateLimit("k", 3, WINDOW, t).remaining, 1);
    assert.equal(rateLimit("k", 3, WINDOW, t).remaining, 0);
  });

  it("reports a Retry-After of at least one second on refusal", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) rateLimit("k", 3, WINDOW, t);
    const r = rateLimit("k", 3, WINDOW, t);
    assert.equal(r.ok, false);
    assert.ok(r.retryAfter >= 1 && r.retryAfter <= 600, "retryAfter was " + r.retryAfter);
  });

  it("lets the caller through again once the window has passed", () => {
    const t = 1_000_000;
    for (let i = 0; i < 20; i++) rateLimit("k", 20, WINDOW, t);
    assert.equal(rateLimit("k", 20, WINDOW, t).ok, false, "still inside the window");
    assert.equal(rateLimit("k", 20, WINDOW, t + WINDOW + 1).ok, true, "window should have reset");
  });

  it("keeps callers in separate buckets", () => {
    const t = 1_000_000;
    for (let i = 0; i < 20; i++) rateLimit("a", 20, WINDOW, t);
    assert.equal(rateLimit("a", 20, WINDOW, t).ok, false);
    assert.equal(rateLimit("b", 20, WINDOW, t).ok, true, "one caller must not exhaust another's quota");
  });

  it("keeps scopes separate, so a lookup limit is not spent on mock reads", () => {
    const t = 1_000_000;
    for (let i = 0; i < 10; i++) rateLimit("mock:1.2.3.4", 10, 60_000, t);
    assert.equal(rateLimit("mock:1.2.3.4", 10, 60_000, t).ok, false);
    assert.equal(rateLimit("lookup:1.2.3.4", 20, WINDOW, t).ok, true);
  });

  it("derives the caller from the left-most forwarded address", () => {
    const req = new Request("https://example.test/", {
      headers: { "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" }
    });
    assert.equal(callerKey(req, "lookup"), "lookup:203.0.113.7");
  });

  it("falls back to a single bucket when no address is present", () => {
    assert.equal(callerKey(new Request("https://example.test/"), "lookup"), "lookup:unknown");
  });
});
