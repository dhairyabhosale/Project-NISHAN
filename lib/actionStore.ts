/* Which actions the reader has completed, on this device.
 *
 * Same reasoning as lib/grievanceStore: this host starts a fresh instance for
 * almost every request, so anything held only server-side disappears between
 * two page loads. The device is the record; the server log is the audit trail
 * within whichever instance served the request. Disclosed on /whats-real.
 *
 * Pure functions over a Storage-like object so the rules are testable without a
 * browser, which is the F17 lesson applied for the third time.
 *
 * THE SCHEMA VERSION IS LOAD-BEARING, and it is here because of a real bug.
 * A completion was written once and never cleared, so a reader who finished the
 * camera e-KYC saw "your identity check is recorded as complete" for the rest
 * of that browser's life and could not reach the camera step again. On a judged
 * demo that means one tester locks the feature out for their whole session.
 *
 * Two things fix it. `clearActionFrom` below gives the reader a way back, and
 * the version wrapper invalidates every completion already sitting on every
 * device that has ever loaded this build: v1 wrote a bare array, so a v1 value
 * fails the shape check and reads as "nothing completed". No migration code and
 * no orphaned keys - the next write replaces the value in place.
 */

import { ACTION_IDS, type ActionId } from "./actions";

export const ACTION_KEY_PREFIX = "nishan:act:";

/** Bump this to invalidate every stored completion on every device. */
export const ACTION_SCHEMA = 2;

export interface ActionStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** One completed action: which, and when. The when drives the expected-by date. */
export interface CompletedAction {
  id: ActionId;
  at: string;
}

interface StoredActions {
  v: number;
  items: CompletedAction[];
}

function storage(): ActionStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function actionKeyFor(reference: string): string {
  return ACTION_KEY_PREFIX + reference.trim().toUpperCase();
}

function isActionId(v: unknown): v is ActionId {
  return typeof v === "string" && (ACTION_IDS as readonly string[]).includes(v);
}

function isIso(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v) && Number.isFinite(Date.parse(v));
}

/** Everything valid in storage, and nothing else. A tampered, half-written or
 *  previous-schema entry is dropped rather than allowed to render as a
 *  completed action. */
export function readActionsFrom(store: ActionStore | null | undefined, reference: string): CompletedAction[] {
  if (!store) return [];
  try {
    const raw = store.getItem(actionKeyFor(reference));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    // A bare array is the v1 shape. Reading it as empty is the point.
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    const box = parsed as StoredActions;
    if (box.v !== ACTION_SCHEMA || !Array.isArray(box.items)) return [];
    return box.items
      .filter((e): e is CompletedAction =>
        !!e && typeof e === "object" && isActionId((e as CompletedAction).id) && isIso((e as CompletedAction).at))
      .map((e) => ({ id: e.id, at: new Date(e.at).toISOString() }));
  } catch {
    return [];
  }
}

function put(store: ActionStore, reference: string, items: CompletedAction[]): boolean {
  try {
    store.setItem(actionKeyFor(reference), JSON.stringify({ v: ACTION_SCHEMA, items }));
    return true;
  } catch {
    return false;
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
  return put(store, reference, next) ? next : existing;
}

/** Undo one recorded completion, so the action can be done again.
 *
 * The counterpart to writeActionTo, and the thing whose absence was the bug:
 * a completion could be written and never removed. Applies to every id in
 * ACTION_IDS, not just the camera one - the other three record completion the
 * same way and would have stuck the same way. */
export function clearActionFrom(
  store: ActionStore | null | undefined,
  reference: string,
  id: ActionId
): CompletedAction[] {
  const existing = readActionsFrom(store, reference);
  if (!store || !isActionId(id)) return existing;
  const next = existing.filter((e) => e.id !== id);
  if (next.length === existing.length) return existing;
  return put(store, reference, next) ? next : existing;
}

/** Undo every recorded completion for one case. */
export function clearAllActionsFrom(
  store: ActionStore | null | undefined,
  reference: string
): CompletedAction[] {
  const existing = readActionsFrom(store, reference);
  if (!store || existing.length === 0) return existing;
  return put(store, reference, []) ? [] : existing;
}

export function readActions(reference: string): CompletedAction[] {
  return readActionsFrom(storage(), reference);
}

export function writeAction(reference: string, id: ActionId, at: string): CompletedAction[] {
  return writeActionTo(storage(), reference, id, at);
}

export function clearAction(reference: string, id: ActionId): CompletedAction[] {
  return clearActionFrom(storage(), reference, id);
}
