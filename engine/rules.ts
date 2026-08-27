/* The six gate rules — CLAUDE.md §7.1, §7.2, §7.3.
 *
 * Precedence is B1 → B2 → B3 → B4 → B5 → B6, ordered by what must be true
 * first: you cannot be paid if you are not registered, or excluded, or
 * unverified, or have no account to be paid into, or if the state has paused
 * you. Only then does payment state matter. That mirrors the real gate order in
 * the disbursement pipeline, which is why the verdict is defensible to an
 * officer.
 *
 * Each rule declares the systems it needs. If one of those did not answer, the
 * caller returns INDETERMINATE rather than descending — §16.8, never guess past
 * a gap. A wrong cause sends someone to the wrong office and costs a day's wage.
 *
 * NOT ONE USER-FACING WORD LIVES IN THIS FILE. Evidence carries codes and
 * values; the catalogue holds every sentence (§10, §16.4). Values marked `data`
 * are read straight from a mock system — a date, an amount, a name — and are
 * shown as-is, because translating a record would falsify it. */

import type { SystemCode, SystemSnapshot, RecordBySystem } from "../lib/types/systems";
import type {
  BlockerCode, DiagnoseOptions, Evidence, EvidenceValue, EvidenceValueCode, ReasonCode
} from "../lib/types/diagnosis";
import { compareNames } from "./names";
import { formatRupees } from "./format";

/** Land acquired after this date falls outside the scheme (§8.4, §7.3). */
export const LAND_CUTOFF = "2019-02-01";
/** §3 exclusion: superannuated pensioners drawing this much or more. */
export const PENSION_EXCLUSION_THRESHOLD = 10000;
/** Working days a queued payment normally takes to land (§3.6). */
export const PAYMENT_WINDOW_DAYS = 7;

const code = (c: EvidenceValueCode): EvidenceValue => ({ kind: "code", code: c });
const data = (v: string): EvidenceValue => ({ kind: "data", value: v });

export interface RuleHit {
  blocker: BlockerCode;
  reason: ReasonCode;
  evidence: Evidence[];
}

export interface Rule {
  gate: "B1" | "B2" | "B3" | "B4" | "B5" | "B6";
  /** Systems that must have answered before this gate can be judged. */
  requires: SystemCode[];
  evaluate(snapshot: SystemSnapshot, opts: DiagnoseOptions): RuleHit | null;
}

/** Reads a record only when the system actually answered.
 *  The cast is needed because indexing SystemSnapshot with a generic key widens
 *  to a union of every record type; the mapping is sound by construction. */
function rec<S extends SystemCode>(snap: SystemSnapshot, code_: S): RecordBySystem[S] | null {
  const r = snap[code_] as { ok: boolean; record?: RecordBySystem[S] | null };
  return r.ok ? (r.record ?? null) : null;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00.000Z" : ""));
  return new Date(d.getTime() + days * 86400000).toISOString().slice(0, 10);
}

/* ── B1 · Registered? ────────────────────────────────────────────────────── */

const b1: Rule = {
  gate: "B1",
  requires: ["mSCHEME"],
  evaluate(snap) {
    const s = rec(snap, "mSCHEME");

    if (!s) {
      return {
        blocker: "B1", reason: "REGISTRATION_REJECTED",
        evidence: [{
          system: "mSCHEME", field: "SCHEME_REGISTRATION",
          observed: code("NO_RECORD"), expected: code("ACCEPTED_REGISTRATION"),
          note: "NO_APPLICATION_ON_FILE"
        }]
      };
    }

    if (s.registration_state === "REJECTED") {
      return {
        blocker: "B1", reason: "REGISTRATION_REJECTED",
        evidence: [{
          system: "mSCHEME", field: "APPLICATION_STATUS",
          observed: s.rejection_reason ? data(s.rejection_reason) : code("NOT_ACCEPTED"),
          expected: code("ACCEPTED"),
          note: "REGISTRATION_REJECTED",
          slots: s.rejection_reason ? { reason: s.rejection_reason } : undefined
        }]
      };
    }

    if (s.registration_state === "PENDING") {
      return {
        blocker: "B1", reason: "REGISTRATION_PENDING",
        evidence: [{
          system: "mSCHEME", field: "APPLICATION_STATUS",
          observed: code("STILL_BEING_CHECKED"), expected: code("ACCEPTED"),
          note: "REGISTRATION_PENDING"
        }]
      };
    }

    return null;
  }
};

/* ── B2 · Eligible? ──────────────────────────────────────────────────────────
   The carve-out matters more than the rule. Multi-Tasking Staff and Class IV /
   Group D employees are EXCLUDED FROM THE EXCLUSION, and dropping that wrongly
   denies income to the lowest-paid government workers who also farm. ------- */

const b2: Rule = {
  gate: "B2",
  requires: ["mITD", "mPFMS", "mLAND", "mSCHEME"],
  evaluate(snap) {
    const itd = rec(snap, "mITD");
    const pfms = rec(snap, "mPFMS");
    const land = rec(snap, "mLAND");
    const scheme = rec(snap, "mSCHEME");

    const exemptGrade = pfms?.is_mts_class_iv_group_d === true;

    if (itd?.is_taxpayer) {
      return {
        blocker: "B2", reason: "INCOME_TAX_PAYER",
        evidence: [{
          system: "mITD", field: "INCOME_TAX_RECORD",
          observed: data(itd.assessment_year), expected: code("NO_TAX_PAID"),
          note: "INCOME_TAX_PAYER", slots: { year: itd.assessment_year }
        }]
      };
    }

    if (pfms?.govt_employee_flag && !exemptGrade) {
      return {
        blocker: "B2", reason: "GOVT_EMPLOYEE",
        evidence: [{
          system: "mPFMS", field: "EMPLOYMENT_RECORD",
          observed: code("GOVT_SERVICE"), expected: code("NOT_GOVT_OR_EXEMPT"),
          note: "GOVT_EMPLOYEE"
        }]
      };
    }

    if (pfms?.pension_amount != null && pfms.pension_amount >= PENSION_EXCLUSION_THRESHOLD && !exemptGrade) {
      return {
        blocker: "B2", reason: "PENSIONER",
        evidence: [{
          system: "mPFMS", field: "MONTHLY_PENSION",
          observed: data(String(pfms.pension_amount)), expected: data(String(PENSION_EXCLUSION_THRESHOLD)),
          note: "PENSIONER",
          slots: { pension: formatRupees(pfms.pension_amount), threshold: formatRupees(PENSION_EXCLUSION_THRESHOLD) }
        }]
      };
    }

    if (land && land.acquired_on > LAND_CUTOFF) {
      return {
        blocker: "B2", reason: "LAND_ACQUIRED_AFTER_CUTOFF",
        evidence: [{
          system: "mLAND", field: "LAND_ACQUIRED_ON",
          observed: data(land.acquired_on), expected: data(LAND_CUTOFF),
          note: "LAND_ACQUIRED_AFTER_CUTOFF",
          slots: { acquired_on: land.acquired_on, cutoff: LAND_CUTOFF }
        }]
      };
    }

    if (scheme?.family_duplicate_of) {
      return {
        blocker: "B2", reason: "FAMILY_DUPLICATE",
        evidence: [{
          system: "mSCHEME", field: "FAMILY_RECORD",
          observed: code("ANOTHER_MEMBER_PAID"), expected: code("ONE_PER_FAMILY"),
          note: "FAMILY_DUPLICATE"
        }]
      };
    }

    return null;
  }
};

/* ── B3 · Identity verified? ─────────────────────────────────────────────────
   The sub-cause is the entire value here. "Your e-KYC is pending" is useless.
   "The phone number on your Aadhaar is one you no longer use, so the code can
   never reach you" is the product (§7.3). ---------------------------------- */

const b3: Rule = {
  gate: "B3",
  requires: ["mUIDAI", "mSCHEME"],
  evaluate(snap) {
    const u = rec(snap, "mUIDAI");
    const s = rec(snap, "mSCHEME");

    if (!u) {
      return {
        blocker: "B3", reason: "EKYC_PENDING_ACTION",
        evidence: [{
          system: "mUIDAI", field: "IDENTITY_CHECK",
          observed: code("NO_IDENTITY_RECORD"), expected: code("CHECK_FINISHED"),
          note: "EKYC_PENDING_ACTION"
        }]
      };
    }

    if (u.ekyc_state === "COMPLETE") return null;

    const state: EvidenceValueCode = u.ekyc_state === "NOT_STARTED" ? "CHECK_NOT_STARTED" : "CHECK_NOT_FINISHED";

    // Ordered by which fix route the farmer actually needs. A dead phone number
    // is checked first because offering an OTP to someone who cannot receive one
    // is the single most common piece of bad advice in this domain (§7.3).
    if (u.linked_mobile === null) {
      return {
        blocker: "B3", reason: "MOBILE_NOT_LINKED",
        evidence: [
          {
            system: "mUIDAI", field: "IDENTITY_CHECK",
            observed: code(state), expected: code("CHECK_FINISHED"),
            note: "EKYC_BLOCKS_PAYMENT"
          },
          {
            system: "mUIDAI", field: "LINKED_MOBILE",
            observed: code("NONE_LINKED"), expected: code("A_NUMBER_YOU_ANSWER"),
            note: "MOBILE_NOT_LINKED"
          }
        ]
      };
    }

    if (s?.dob_on_record && s.dob_on_record !== u.dob) {
      return {
        blocker: "B3", reason: "DOB_MISMATCH",
        evidence: [{
          system: "mSCHEME", field: "DATE_OF_BIRTH",
          observed: data(s.dob_on_record), expected: data(u.dob),
          note: "DOB_MISMATCH", slots: { on_record: s.dob_on_record, on_aadhaar: u.dob }
        }]
      };
    }

    if (s?.gender_on_record && s.gender_on_record !== u.gender) {
      return {
        blocker: "B3", reason: "GENDER_MISMATCH",
        evidence: [{
          system: "mSCHEME", field: "GENDER",
          observed: data(s.gender_on_record), expected: data(u.gender),
          note: "GENDER_MISMATCH"
        }]
      };
    }

    if (s && !compareNames(s.name, u.name).match) {
      return {
        blocker: "B3", reason: "NAME_VARIANCE",
        evidence: [{
          system: "mSCHEME", field: "NAME",
          observed: data(s.name), expected: data(u.name),
          note: "NAME_VARIANCE", slots: { on_record: s.name, on_aadhaar: u.name }
        }]
      };
    }

    return {
      blocker: "B3", reason: "EKYC_PENDING_ACTION",
      evidence: [{
        system: "mUIDAI", field: "IDENTITY_CHECK",
        observed: code(state), expected: code("CHECK_FINISHED"),
        note: "EKYC_PENDING_ACTION"
      }]
    };
  }
};

/* ── B4 · Somewhere to be paid? ──────────────────────────────────────────── */

const b4: Rule = {
  gate: "B4",
  requires: ["mNPCI"],
  evaluate(snap) {
    const n = rec(snap, "mNPCI");

    if (!n || n.mapper_state === "NOT_FOUND") {
      return {
        blocker: "B4", reason: "MAPPER_NOT_FOUND",
        evidence: [{
          system: "mNPCI", field: "AADHAAR_BANK_LINK",
          observed: code("NO_LINK"), expected: code("LINK_TO_YOUR_ACCOUNT"),
          note: "MAPPER_NOT_FOUND"
        }]
      };
    }

    if (n.mapper_state === "INACTIVE") {
      return {
        blocker: "B4", reason: "MAPPER_INACTIVE",
        evidence: [{
          system: "mNPCI", field: "AADHAAR_BANK_LINK",
          observed: code("LINK_INACTIVE"), expected: code("ACTIVE_LINK"),
          note: "MAPPER_INACTIVE"
        }]
      };
    }

    if (n.mapper_state === "DIFFERENT_BANK") {
      return {
        blocker: "B4", reason: "MAPPER_DIFFERENT_BANK",
        evidence: [{
          system: "mNPCI", field: "AADHAAR_BANK_LINK",
          observed: n.mapped_bank ? data(n.mapped_bank) : code("NO_LINK"),
          expected: code("LINK_TO_YOUR_ACCOUNT"),
          note: "MAPPER_DIFFERENT_BANK",
          slots: n.mapped_bank ? { other_bank: n.mapped_bank } : undefined
        }]
      };
    }

    return null;
  }
};

/* ── B5 · Has the state paused you? ──────────────────────────────────────── */

const b5: Rule = {
  gate: "B5",
  requires: ["mLAND", "mUIDAI"],
  evaluate(snap) {
    const l = rec(snap, "mLAND");
    const u = rec(snap, "mUIDAI");
    const s = rec(snap, "mSCHEME");

    if (!l) {
      return {
        blocker: "B5", reason: "LAND_NOT_SEEDED",
        evidence: [{
          system: "mLAND", field: "LAND_RECORD",
          observed: code("NO_LAND_RECORD"), expected: code("LAND_LINKED"),
          note: "LAND_NOT_SEEDED"
        }]
      };
    }

    if (u) {
      const cmp = compareNames(l.owner_name, u.name);
      if (!cmp.match) {
        return {
          blocker: "B5", reason: "LAND_NAME_MISMATCH",
          evidence: [{
            system: "mLAND", field: "LAND_NAME",
            observed: data(l.owner_name), expected: data(u.name),
            note: "LAND_NAME_MISMATCH",
            slots: { land_name: l.owner_name, aadhaar_name: u.name }
          }]
        };
      }
    }

    if (!l.seeded) {
      return {
        blocker: "B5", reason: "LAND_NOT_SEEDED",
        evidence: [{
          system: "mLAND", field: "LAND_LINK",
          observed: code("LAND_NOT_LINKED"), expected: code("LAND_LINKED"),
          note: "LAND_NOT_SEEDED"
        }]
      };
    }

    if (s?.status_string === "Stopped by State") {
      return {
        blocker: "B5", reason: "STATE_HOLD",
        evidence: [{
          system: "mSCHEME", field: "STATE_APPROVAL",
          observed: code("PAUSED_BY_STATE"), expected: code("APPROVED"),
          note: "STATE_HOLD"
        }]
      };
    }

    return null;
  }
};

/* ── B6 · Where is the payment? ──────────────────────────────────────────────
   Always returns a verdict. By this point nothing is blocking, so the only
   question left is where the money actually is. ---------------------------- */

const b6: Rule = {
  gate: "B6",
  requires: ["mPFMS", "mBANK", "mSCHEME"],
  evaluate(snap, opts) {
    const pfms = rec(snap, "mPFMS");
    const bank = rec(snap, "mBANK");
    const scheme = rec(snap, "mSCHEME");

    const credit = bank?.credits.find((c) => c.cycle === opts.cycle) ?? null;
    const instalment = scheme?.instalments.find((i) => i.cycle === opts.cycle) ?? null;

    // B6c first: the counter-intuitive win. The money was there all along.
    if (credit || instalment?.credited_on) {
      const on = credit?.credited_on ?? instalment?.credited_on ?? "";
      const amount = formatRupees(credit?.amount ?? instalment?.amount ?? 2000);
      return {
        blocker: "B6c", reason: "CREDITED",
        evidence: [{
          system: "mBANK", field: "PAYMENT_RECEIVED",
          observed: data(on), expected: code("A_PAYMENT"),
          note: "CREDITED",
          slots: { amount, date: on, last4: credit?.account_last4 ?? (bank?.account_ref.slice(-4) ?? "") }
        }]
      };
    }

    if (bank?.account_state === "CLOSED") {
      return {
        blocker: "B6b", reason: "ACCOUNT_CLOSED",
        evidence: [{
          system: "mBANK", field: "BANK_ACCOUNT",
          observed: code("ACCOUNT_IS_CLOSED"), expected: code("ACCOUNT_OPEN"),
          note: "ACCOUNT_CLOSED"
        }]
      };
    }

    if (bank?.account_state === "DORMANT") {
      return {
        blocker: "B6b", reason: "ACCOUNT_DORMANT",
        evidence: [{
          system: "mBANK", field: "BANK_ACCOUNT",
          observed: code("ACCOUNT_IS_DORMANT"), expected: code("ACCOUNT_OPEN"),
          note: "ACCOUNT_DORMANT"
        }]
      };
    }

    if (pfms?.fto_state === "REJECTED") {
      return {
        blocker: "B6b", reason: "BANK_RETURNED",
        evidence: [{
          system: "mBANK", field: "PAYMENT_ATTEMPT",
          observed: code("RETURNED_BY_BANK"), expected: code("ACCEPTED_BY_BANK"),
          note: "BANK_RETURNED"
        }]
      };
    }

    const expectedBy = instalment ? addDays(instalment.released_on, PAYMENT_WINDOW_DAYS) : "";
    const waiting = (reason: ReasonCode, observed: EvidenceValueCode, note: Evidence["note"]): RuleHit => ({
      blocker: "B6a", reason,
      evidence: [{
        system: "mPFMS", field: "PAYMENT_PROGRESS",
        observed: code(observed), expected: code("PAID_TO_ACCOUNT"),
        note,
        slots: expectedBy ? { expected_by: expectedBy } : undefined
      }]
    });

    switch (pfms?.fto_state) {
      case "GENERATED": return waiting("FTO_IN_QUEUE", "IN_PAYMENT_QUEUE", "FTO_IN_QUEUE");
      case "RFT_SIGNED": return waiting("RFT_SIGNED", "STATE_SIGNED_FORWARDED", "RFT_SIGNED");
      case "SETTLEMENT_PENDING":
      case "PAID": return waiting("SETTLEMENT_PENDING", "SENT_SETTLING", "SETTLEMENT_PENDING");
      default: return waiting("NOT_YET_QUEUED", "NOT_IN_QUEUE", "NOT_YET_QUEUED");
    }
  }
};

/** In precedence order. The caller walks this and stops at the first hit. */
export const RULES: readonly Rule[] = [b1, b2, b3, b4, b5, b6];
