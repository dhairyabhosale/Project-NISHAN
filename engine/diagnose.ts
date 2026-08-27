/* The diagnosis engine — CLAUDE.md §8.5.
 *
 * §8.1: "The UI is the thin part. The Mock Government Systems Layer and the
 * Diagnosis Engine are the product." §15: the engine may never be cut.
 *
 * Four properties this file exists to guarantee:
 *
 *   DETERMINISTIC   Same inputs, same output, always. No randomness, no clock
 *                   read outside the injected `now`, and no language model
 *                   anywhere in this path — not a heuristic, not a tiebreak,
 *                   not a confidence boost (§16.2).
 *   ONE VERDICT     Fixed precedence B1→B5, then payment state. The first
 *                   blocking rule wins and evaluation STOPS. The farmer sees
 *                   one cause, not six flags (§6.2).
 *   EVIDENCE-BOUND  Every verdict names the system, the field, what was seen
 *                   and what was needed. That drives the Visit Slip and the
 *                   grievance draft for free (§3.7, §8.5).
 *   HONEST GAPS     If a system needed to RULE OUT a higher-precedence blocker
 *                   did not answer, return INDETERMINATE. Never fall through to
 *                   a lower-precedence guess (§16.8). */

import type { SystemCode, SystemSnapshot } from "../lib/types/systems";
import { unreachableSystems } from "../lib/types/systems";
import type { BlockerCode, DiagnoseOptions, Diagnosis, Evidence } from "../lib/types/diagnosis";
import { RULESET_VERSION } from "../lib/types/diagnosis";
import { RULES } from "./rules";
import type { RuleHit } from "./rules";

/** Slot values for the content layer (§10.3). Everything here is read from a
 *  mock system of record — nothing is inferred, predicted or authored. */
function buildFacts(snapshot: SystemSnapshot, opts: DiagnoseOptions, hit: RuleHit | null): Record<string, string> {
  const scheme = snapshot.mSCHEME.ok ? snapshot.mSCHEME.record : null;
  const uidai = snapshot.mUIDAI.ok ? snapshot.mUIDAI.record : null;
  const land = snapshot.mLAND.ok ? snapshot.mLAND.record : null;
  const bank = snapshot.mBANK.ok ? snapshot.mBANK.record : null;
  const npci = snapshot.mNPCI.ok ? snapshot.mNPCI.record : null;

  const instalment = scheme?.instalments.find((i) => i.cycle === opts.cycle) ?? null;
  const credit = bank?.credits.find((c) => c.cycle === opts.cycle) ?? null;

  const facts: Record<string, string> = {
    cycle: opts.cycle,
    amount: String(instalment?.amount ?? credit?.amount ?? 2000)
  };

  const put = (k: string, v: string | null | undefined) => { if (v != null && v !== "") facts[k] = String(v); };

  put("reg_no", scheme?.reg_no);
  put("name", scheme?.name ?? uidai?.name);
  put("village", scheme?.village);
  put("state", scheme?.state);
  put("released_on", instalment?.released_on);
  put("rejection_reason", scheme?.rejection_reason);
  put("aadhaar_name", uidai?.name);
  put("land_owner_name", land?.owner_name);
  put("khata_id", land?.khata_id);
  put("account_ref", bank?.account_ref);
  put("ifsc", bank?.ifsc);
  put("bank_name", npci?.mapped_bank);
  put("credited_on", credit?.credited_on ?? instalment?.credited_on);
  put("last4", credit?.account_last4 ?? bank?.account_ref.slice(-4));

  if (hit) {
    put("blocker", hit.blocker);
    put("reason_code", hit.reason);
    // The expected-by date is parsed out of the evidence note the rule already
    // derived from mock data, so no date is ever predicted (§9.2).
    const expected = hit.evidence.map((e) => e.note).join(" ").match(/Expected by (\d{4}-\d{2}-\d{2})/);
    if (expected) put("expected_by", expected[1]);
  }

  return facts;
}

/**
 * Lower-precedence blockers that are ALSO live.
 *
 * Recorded for the grievance and for an officer reading the case — never shown
 * as the verdict, and never allowed to influence it. Gathered only from systems
 * that actually answered.
 *
 * B6a is excluded: "not yet queued" is trivially true for anything blocked
 * earlier, so listing it would be noise rather than an observation. A returned
 * payment (B6b) or an existing credit (B6c) is genuinely worth an officer's
 * attention, so those are kept.
 */
function collectObservations(snapshot: SystemSnapshot, opts: DiagnoseOptions, afterIndex: number): BlockerCode[] {
  const out: BlockerCode[] = [];
  for (let i = afterIndex + 1; i < RULES.length; i++) {
    const rule = RULES[i];
    if (rule.requires.some((c) => !snapshot[c].ok)) continue;
    const hit = rule.evaluate(snapshot, opts);
    if (!hit || hit.blocker === "B6a") continue;
    out.push(hit.blocker);
  }
  return out;
}

function indeterminate(
  snapshot: SystemSnapshot,
  opts: DiagnoseOptions,
  gate: string,
  missing: SystemCode[],
  cleared: string[]
): Diagnosis {
  const evidence: Evidence[] = missing.map((system) => ({
    system,
    field: "Government record",
    observed: "No answer right now",
    expected: "A current record",
    note: "We could not reach this record system, so we will not guess. Your case is saved and we will check again."
  }));

  if (cleared.length) {
    evidence.unshift({
      system: "mSCHEME",
      field: "Checks already passed",
      observed: cleared.join(", ") + " confirmed clear",
      expected: "All checks clear",
      note: "These parts of your payment were checked and are fine. The next check is the one we could not reach."
    });
  }

  return {
    primaryBlocker: "B0",
    reason: "SYSTEM_UNREACHABLE",
    confidence: "indeterminate",
    evidence,
    facts: { ...buildFacts(snapshot, opts, null), stopped_at: gate },
    portalStatus: snapshot.mSCHEME.ok ? (snapshot.mSCHEME.record?.status_string ?? null) : null,
    secondaryObservations: [],
    unreachableSystems: unreachableSystems(snapshot),
    rulesetVersion: RULESET_VERSION,
    evaluatedAt: opts.now
  };
}

/**
 * Reconcile seven systems of record and return exactly one primary blocker.
 *
 * @param snapshot every system's answer, including the ones that did not answer
 * @param opts     the cycle under diagnosis and an injected `now`
 */
export function diagnose(snapshot: SystemSnapshot, opts: DiagnoseOptions): Diagnosis {
  const portalStatus = snapshot.mSCHEME.ok ? (snapshot.mSCHEME.record?.status_string ?? null) : null;
  const cleared: string[] = [];

  for (let i = 0; i < RULES.length; i++) {
    const rule = RULES[i];

    // §16.8. A system that did not answer is not the same as a system that
    // answered "nothing here" — the SystemResult split from E1 is what makes
    // this check possible, and it is the only thing standing between an honest
    // "we do not know" and a confident wrong answer.
    const missing = rule.requires.filter((c) => !snapshot[c].ok);
    if (missing.length) {
      return indeterminate(snapshot, opts, rule.gate, missing, cleared);
    }

    const hit = rule.evaluate(snapshot, opts);
    if (hit) {
      return {
        primaryBlocker: hit.blocker,
        reason: hit.reason,
        confidence: "certain",
        evidence: hit.evidence,
        facts: buildFacts(snapshot, opts, hit),
        portalStatus,
        secondaryObservations: collectObservations(snapshot, opts, i),
        unreachableSystems: unreachableSystems(snapshot),
        rulesetVersion: RULESET_VERSION,
        evaluatedAt: opts.now
      };
    }

    cleared.push(rule.gate);
  }

  /* Unreachable in practice: B6 always returns a verdict, because once nothing
     is blocking, the money is either credited, returned, or on its way. Kept so
     the function is total rather than relying on that argument holding. */
  return {
    primaryBlocker: "B6a",
    reason: "NONE",
    confidence: "certain",
    evidence: [{
      system: "mPFMS",
      field: "Payment progress",
      observed: "No blocker found",
      expected: "Paid into your account",
      note: "Nothing is blocking this payment."
    }],
    facts: buildFacts(snapshot, opts, null),
    portalStatus,
    secondaryObservations: [],
    unreachableSystems: unreachableSystems(snapshot),
    rulesetVersion: RULESET_VERSION,
    evaluatedAt: opts.now
  };
}
