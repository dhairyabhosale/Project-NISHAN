/* User-created demo cases.
 *
 * STATELESS BY DESIGN. The case is encoded into the link, not stored on the
 * server. Same reason case references are derived rather than allocated: this
 * runs on a serverless host where the request that creates a case and the
 * request that opens it can land on different instances, so anything held in
 * memory would hand out a link that 404s a moment later.
 *
 * The diagnosis itself is never faked. A custom case clones the fixture that
 * already demonstrates the chosen blocker and swaps in the new name and a fresh
 * set of synthetic identifiers, so the real engine reaches the real verdict by
 * the real precedence rules. Picking a blocker chooses the SITUATION, not the
 * answer - if the engine disagreed with the label, the engine would win.
 *
 * Every identifier is generated in a 12.3 format and is structurally invalid as
 * a real credential. */

import { PERSONAS, type PersonaFixture } from "../mocks/fixtures";

export interface DemoSpec {
  /** Display name. Trimmed and length-capped; never used as an identifier. */
  n: string;
  /** Blocker to demonstrate, e.g. "B3". */
  b: string;
}

const MAX_NAME = 40;

/** Deterministic 0..(mod-1) from a string, so one spec always yields one case. */
function seed(s: string, mod: number): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % mod;
}

function digits(s: string, n: number): string {
  return String(seed(s, Math.pow(10, n))).padStart(n, "0");
}

export function encodeSpec(spec: DemoSpec): string {
  const json = JSON.stringify({ n: spec.n.slice(0, MAX_NAME), b: spec.b });
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeSpec(encoded: string): DemoSpec | null {
  try {
    const raw = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as Partial<DemoSpec>;
    if (typeof parsed.n !== "string" || typeof parsed.b !== "string") return null;
    const name = parsed.n.trim().slice(0, MAX_NAME);
    if (!name) return null;
    if (!PERSONAS.some((p) => p.expects.blocker === parsed.b)) return null;
    return { n: name, b: parsed.b };
  } catch {
    return null;
  }
}

/** Blockers a user can pick, each backed by a fixture that already produces it. */
export function availableBlockers(): { blocker: string; reason: string; ref: string }[] {
  return PERSONAS.map((p) => ({
    blocker: p.expects.blocker,
    reason: p.expects.reason,
    ref: p.ref
  }));
}

/**
 * Build a persona for a spec by cloning the fixture that demonstrates the
 * chosen blocker and replacing identity with fresh synthetic values.
 */
export function personaForSpec(spec: DemoSpec): PersonaFixture | null {
  const template = PERSONAS.find((p) => p.expects.blocker === spec.b);
  if (!template) return null;

  const s = spec.n + "|" + spec.b;
  const clone = structuredClone(template) as PersonaFixture;

  clone.ref = "U-" + digits(s, 6);
  clone.label = spec.n;

  // 12.3 formats throughout: 9999-prefixed Aadhaar, unallocated 5-series
  // mobile, MOCKACC / MOCK / MOCKP / NSHDEMO. None is usable as a credential.
  const aadhaar = "9999 " + digits(s + "a", 4) + " " + digits(s + "b", 4);

  if (clone.mSCHEME) {
    clone.mSCHEME.reg_no = "NSHDEMO-" + digits(s + "r", 4);
    clone.mSCHEME.name = spec.n;
  }
  if (clone.mUIDAI) {
    clone.mUIDAI.aadhaar_ref = aadhaar;
    clone.mUIDAI.name = spec.n;
    if (clone.mUIDAI.linked_mobile) clone.mUIDAI.linked_mobile = "+91 5" + digits(s + "m", 9);
  }
  if (clone.mNPCI) clone.mNPCI.aadhaar_ref = aadhaar;
  if (clone.mBANK) {
    const last4 = digits(s + "c", 4);
    clone.mBANK.account_ref = "MOCKACC-" + last4;
    clone.mBANK.credits = clone.mBANK.credits.map((c) => ({ ...c, account_last4: last4 }));
  }
  if (clone.mITD) clone.mITD.pan_ref = "MOCKP" + digits(s + "p", 4) + "M";

  // The land record keeps the template's relationship to the Aadhaar name: a
  // real mismatch stays a real mismatch, a benign variance stays benign. That
  // is what makes the chosen blocker actually come out of the engine.
  if (clone.mLAND) {
    const matched = template.mUIDAI && template.mLAND
      && template.mLAND.owner_name.split(" ")[0] === template.mUIDAI.name.split(" ")[0];
    clone.mLAND.khata_id = "KH-" + digits(s + "k", 5);
    if (matched) clone.mLAND.owner_name = spec.n;
  }

  return clone;
}
