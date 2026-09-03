/* Which actions the reader has completed, on this device.
 *
 * Same reasoning as lib/grievanceStore: this host starts a fresh instance for
 * almost every request, so anything held only server-side disappears between
 * two page loads. The device is the record; the server log is the audit trail
 * within whichever instance served the request. Disclosed on /whats-real.
 *
 * Pure functions over a Storage-like object so the rules are testable without a
 * browser, which is the F17 lesson applied for the third time.
 */

import { ACTION_IDS, type ActionId } from "./actions";

export const ACTION_KEY_PREFIX = "nishan:act:";

export interface ActionStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** One completed action: which, and when. The when drives the expected-by date. */
export interface CompletedAction {
  id: ActionId;
  at: string;
}

function storage(): ActionStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function keyFor(reference: string): string {
  return ACTION_KEY_PREFIX + reference.trim().toUpperCase();
}

function isActionId(v: unknown): v is ActionId {
  return typeof v === "string" && (ACTION_IDS as readonly string[]).includes(v);
}

function isIso(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v) && Number.isFinite(Date.parse(v));
}

/** Everything valid in storage, and nothing else. A tampered or half-written
 *  entry is dropped rather than allowed to render as a completed action. */
export function readActionsFrom(store: ActionStore | null | undefined, reference: string): CompletedAction[] {
  if (!store) return [];
  try {
    const raw = store.getItem(keyFor(reference));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is CompletedAction =>
        !!e && typeof e === "object" && isActionId((e as CompletedAction).id) && isIso((e as CompletedAction).at))
      .map((e) => ({ id: e.id, at: new Date(e.at).toISOString() }));
  } catch {
    return [];
  }
}

/** Record a completion. Idempotent: doing the same action twice does not add a
 *  second row and does not move the first one's date, because the expected-by
 *  date the reader was given must not slide (§8.7). */
export function writeActionTo(
  store: ActionStore | null | undefined,
  reference: string,
  id: ActionId,
  at: string
): CompletedAction[] {
  const existing = readActionsFrom(store, reference);
  if (!store || !isIso(at) || !isActionId(id)) return existing;
  if (existing.some((e) => e.id === id)) return existing;
  const next = [...existing, { id, at: new Date(at).toISOString() }];
  try {
    store.setItem(keyFor(reference), JSON.stringify(next));
  } catch {
    return existing;
  }
  return next;
}

export function readActions(reference: string): CompletedAction[] {
  return readActionsFrom(storage(), reference);
}

export function writeAction(reference: string, id: ActionId, at: string): CompletedAction[] {
  return writeActionTo(storage(), reference, id, at);
}
