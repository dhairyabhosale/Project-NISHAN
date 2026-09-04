/* The return path. One reference, on the device.
 *
 * WHY THIS INSTEAD OF A LOGIN. Competitors put a dashboard behind an account,
 * but nobody can really authenticate a farmer against UIDAI, so what they ship
 * is theatre with more screens - and every screen is a drop-off point (P10),
 * every password a barrier for the reader §5.1 describes. §12.4 already settled
 * the model: a case reference IS the credential, deliberately thin, carrying
 * status and next step and no identity data.
 *
 * So the return path is the reference, remembered on the device that saw it.
 * A reader gets the benefit of a dashboard - one tap back to their case, on
 * this phone - and the same case opens on any other phone from the reference
 * alone, which no login-gated dashboard can offer a helper.
 *
 * Deliberately ONE reference, not a history. §12.1: data we do not need, we do
 * not collect. A list of every case a phone has seen is a record of who a
 * helper has helped, and we have no use for it.
 */

export const RECENT_KEY = "nishan:last";

export interface RecentStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storage(): RecentStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** §12.3 shape. Anything else is ignored rather than trusted into a link. */
export function isReference(v: unknown): v is string {
  return typeof v === "string" && /^NSH-[0-9A-F]{4}$/.test(v.trim().toUpperCase());
}

export function readRecentFrom(store: RecentStore | null | undefined): string | null {
  if (!store) return null;
  try {
    const raw = store.getItem(RECENT_KEY);
    return isReference(raw) ? raw.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

export function writeRecentTo(store: RecentStore | null | undefined, reference: string): void {
  if (!store || !isReference(reference)) return;
  try {
    store.setItem(RECENT_KEY, reference.trim().toUpperCase());
  } catch {
    /* private window, or site data blocked */
  }
}

export function forgetRecentFrom(store: RecentStore | null | undefined): void {
  if (!store) return;
  try {
    store.removeItem(RECENT_KEY);
  } catch {
    /* nothing to forget */
  }
}

export function readRecent(): string | null {
  return readRecentFrom(storage());
}

export function writeRecent(reference: string): void {
  writeRecentTo(storage(), reference);
}

export function forgetRecent(): void {
  forgetRecentFrom(storage());
}
