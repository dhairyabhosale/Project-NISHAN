/* Where a filing date lives on the device.
 *
 * A grievance is one fact - the instant it was filed. The tier, the deadline,
 * the days remaining and the CPGRAMS offer are all pure functions of that
 * instant (lib/escalation), so nothing is stored that could drift out of step
 * with the rules that produce it.
 *
 * WHY THE DEVICE AND NOT ONLY THE SERVER: the event log is one instance's
 * memory, and on this host almost every request gets a fresh instance - the
 * same measurement that made the rate limiter inert (lib/rateLimit). A filing
 * held only server-side would vanish between two page loads, which for a
 * feature whose entire subject is a thirty-day wait would be worse than not
 * shipping it. So the device is the record of record, and the server log is
 * the audit trail within whichever instance served the request.
 *
 * Disclosed on /whats-real rather than implied away. Same shape of decision as
 * a derived case reference and a link-encoded demo case: state that cannot be
 * reconstructed hands out links that break a second later.
 *
 * Pure functions over a Storage-like object, so the rules are testable without
 * a browser - the F17 lesson, applied again.
 */

export const GRIEVANCE_KEY_PREFIX = "nishan:grievance:";

export interface FiledStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function storage(): FiledStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function keyFor(reference: string): string {
  return GRIEVANCE_KEY_PREFIX + reference.trim().toUpperCase();
}

/** An ISO instant that is actually an instant, not "yes" or a number. */
export function parseFiledAt(raw: string | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(trimmed)) return null;
  const t = Date.parse(trimmed);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export function readFiledAtFrom(store: FiledStore | null | undefined, reference: string): string | null {
  if (!store) return null;
  try {
    return parseFiledAt(store.getItem(keyFor(reference)));
  } catch {
    return null;
  }
}

export function writeFiledAtTo(store: FiledStore | null | undefined, reference: string, filedAt: string): void {
  if (!store) return;
  const clean = parseFiledAt(filedAt);
  if (!clean) return;
  try {
    // Never overwrite an existing filing. §8.7's duplicate-action guard: a
    // second press must not restart a clock the reader is already waiting on.
    if (store.getItem(keyFor(reference))) return;
    store.setItem(keyFor(reference), clean);
  } catch {
    /* private window, or site data blocked */
  }
}

export function readFiledAt(reference: string): string | null {
  return readFiledAtFrom(storage(), reference);
}

export function writeFiledAt(reference: string, filedAt: string): void {
  writeFiledAtTo(storage(), reference, filedAt);
}
