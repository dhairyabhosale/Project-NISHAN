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
 * §16.5: no system vocabulary reaches a farmer. Evidence is rendered on S5, so
 * field labels here are plain language, not column names. Officer-facing
 * precision belongs in the Fix Path and Visit Slip (E7), not here. */

import type { SystemCode, SystemSnapshot, RecordBySystem } from "../lib/types/systems";
import type { BlockerCode, Evidence, ReasonCode, DiagnoseOptions } from "../lib/types/diagnosis";
import { compareNames } from "./names";

/** Land acquired after this date falls outside the scheme (§8.4, §7.3). */
const LAND_CUTOFF = "2019-02-01";
/** §3 exclusion: superannuated pensioners drawing this much or more. */
const PENSION_EXCLUSION_THRESHOLD = 10000;

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
function rec<S extends SystemCode>(snap: SystemSnapshot, code: S): RecordBySystem[S] | null {
  const r = snap[code] as { ok: boolean; record?: RecordBySystem[S] | null };
  return r.ok ? (r.record ?? null) : null;
}

function addDays(iso: string, days: number): string {
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
          system: "mSCHEME", field: "Scheme registration",
          observed: "No record found",
          expected: "An accepted registration",
          note: "The scheme has no application on file for these details."
        }]
      };
    }

    if (s.registration_state === "REJECTED") {
      return {
        blocker: "B1", reason: "REGISTRATION_REJECTED",
        evidence: [{
          system: "mSCHEME", field: "Application status",
          observed: "Not accepted" + (s.rejection_reason ? " — " + s.rejection_reason : ""),
          expected: "Accepted",
          note: "Your application was not accepted, so no instalment can be paid until that is put right."
        }]
      };
    }

    if (s.registration_state === "PENDING") {
      return {
        blocker: "B1", reason: "REGISTRATION_PENDING",
        evidence: [{
          system: "mSCHEME", field: "Application status",
          observed: "Still being checked",
          expected: "Accepted",
          note: "Your application has not finished being checked."
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

    // MTS / Class IV / Group D are exempt from the employment and pension
    // exclusions. This is what makes a wrong exclusion contestable (§7.2 B2).
    const exemptGrade = pfms?.is_mts_class_iv_group_d === true;

    if (itd?.is_taxpayer) {
      return {
        blocker: "B2", reason: "INCOME_TAX_PAYER",
        evidence: [{
          system: "mITD", field: "Income tax record",
          observed: "Recorded as having paid income tax in " + itd.assessment_year,
          expected: "No income tax paid in the last assessment year",
          note: "Your record is marked as an income tax payer for that year. If that is wrong, it can be challenged."
        }]
      };
    }

    if (pfms?.govt_employee_flag && !exemptGrade) {
      return {
        blocker: "B2", reason: "GOVT_EMPLOYEE",
        evidence: [{
          system: "mPFMS", field: "Employment record",
          observed: "Recorded as a serving or retired government employee",
          expected: "Not a government employee, or in an exempt grade",
          note: "Your record is marked as government service. Multi-Tasking Staff and Class IV or Group D grades are exempt from this rule."
        }]
      };
    }

    if (pfms?.pension_amount != null && pfms.pension_amount >= PENSION_EXCLUSION_THRESHOLD && !exemptGrade) {
      return {
        blocker: "B2", reason: "PENSIONER",
        evidence: [{
          system: "mPFMS", field: "Monthly pension",
          observed: "₹" + pfms.pension_amount,
          expected: "Below ₹" + PENSION_EXCLUSION_THRESHOLD,
          note: "Your recorded pension is at or above the limit for this scheme. Multi-Tasking Staff and Class IV or Group D grades are exempt."
        }]
      };
    }

    if (land && land.acquired_on > LAND_CUTOFF) {
      return {
        blocker: "B2", reason: "LAND_ACQUIRED_AFTER_CUTOFF",
        evidence: [{
          system: "mLAND", field: "Date land was acquired",
          observed: land.acquired_on,
          expected: "On or before " + LAND_CUTOFF,
          note: "The land was recorded as acquired after the scheme cut-off date."
        }]
      };
    }

    if (scheme?.family_duplicate_of) {
      return {
        blocker: "B2", reason: "FAMILY_DUPLICATE",
        evidence: [{
          system: "mSCHEME", field: "Family record",
          observed: "Another member of the household is already receiving this benefit",
          expected: "One payment per family",
          note: "The scheme pays one family once. Another member of your household is already on the list."
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
          system: "mUIDAI", field: "Identity check",
          observed: "No identity record found",
          expected: "A completed identity check",
          note: "Your identity check is not on file, so no instalment can be paid."
        }]
      };
    }

    if (u.ekyc_state === "COMPLETE") return null;

    const observedState = u.ekyc_state === "NOT_STARTED" ? "Not started" : "Not finished";

    // Ordered by which fix route the farmer actually needs. A dead phone number
    // is checked first because offering an OTP to someone who cannot receive one
    // is the single most common piece of bad advice in this domain (§7.3).
    if (u.linked_mobile === null) {
      return {
        blocker: "B3", reason: "MOBILE_NOT_LINKED",
        evidence: [
          {
            system: "mUIDAI", field: "Identity check",
            observed: observedState, expected: "Finished",
            note: "Your identity check is not finished, so no instalment can be paid."
          },
          {
            system: "mUIDAI", field: "Phone number linked to your Aadhaar",
            observed: "None linked",
            expected: "A phone number you can answer",
            note: "No phone number is linked to your Aadhaar, so a one-time code cannot reach you. The online route will not work — you need a route that does not use a code."
          }
        ]
      };
    }

    if (s?.dob_on_record && s.dob_on_record !== u.dob) {
      return {
        blocker: "B3", reason: "DOB_MISMATCH",
        evidence: [{
          system: "mSCHEME", field: "Date of birth",
          observed: s.dob_on_record + " on the scheme record",
          expected: u.dob + ", as on your Aadhaar",
          note: "The two records hold different dates of birth, so the identity check cannot complete."
        }]
      };
    }

    if (s && !compareNames(s.name, u.name).match) {
      return {
        blocker: "B3", reason: "NAME_VARIANCE",
        evidence: [{
          system: "mSCHEME", field: "Name",
          observed: s.name + " on the scheme record",
          expected: u.name + ", as on your Aadhaar",
          note: "The two records hold different names, so the identity check cannot complete."
        }]
      };
    }

    return {
      blocker: "B3", reason: "EKYC_PENDING_ACTION",
      evidence: [{
        system: "mUIDAI", field: "Identity check",
        observed: observedState, expected: "Finished",
        note: "Your identity check is not finished. Until it is, no instalment can be paid."
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
          system: "mNPCI", field: "Aadhaar linked to a bank account",
          observed: "No link on file",
          expected: "Your Aadhaar linked to your bank account",
          note: "Your Aadhaar is not linked to any bank account, so the money has nowhere to land."
        }]
      };
    }

    if (n.mapper_state === "INACTIVE") {
      return {
        blocker: "B4", reason: "MAPPER_INACTIVE",
        evidence: [{
          system: "mNPCI", field: "Aadhaar linked to a bank account",
          observed: "Link is inactive",
          expected: "An active link",
          note: "Your bank has not linked your Aadhaar to your account. The money has nowhere to land."
        }]
      };
    }

    if (n.mapper_state === "DIFFERENT_BANK") {
      return {
        blocker: "B4", reason: "MAPPER_DIFFERENT_BANK",
        evidence: [{
          system: "mNPCI", field: "Aadhaar linked to a bank account",
          observed: "Linked to " + (n.mapped_bank ?? "another bank"),
          expected: "Linked to the account you use for this scheme",
          note: "Your Aadhaar is linked to a different bank, so the money is going somewhere you are not looking."
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
          system: "mLAND", field: "Land record",
          observed: "No land record linked",
          expected: "Your land record linked to this application",
          note: "No land record is attached to your application, so your state cannot approve the payment."
        }]
      };
    }

    if (u) {
      const cmp = compareNames(l.owner_name, u.name);
      if (!cmp.match) {
        return {
          blocker: "B5", reason: "LAND_NAME_MISMATCH",
          evidence: [{
            system: "mLAND", field: "Name on the land record",
            observed: l.owner_name,
            expected: u.name + ", as on your Aadhaar",
            note: "Your land record and your Aadhaar name do not match, so your state has paused your payment."
          }]
        };
      }
    }

    if (!l.seeded) {
      return {
        blocker: "B5", reason: "LAND_NOT_SEEDED",
        evidence: [{
          system: "mLAND", field: "Land record linked to your application",
          observed: "Not linked",
          expected: "Linked",
          note: "Your land record has not been attached to your application, so your state cannot approve the payment."
        }]
      };
    }

    if (s?.status_string === "Stopped by State") {
      return {
        blocker: "B5", reason: "STATE_HOLD",
        evidence: [{
          system: "mSCHEME", field: "State approval",
          observed: "Paused by your state",
          expected: "Approved",
          note: "Your state has paused this payment and has not recorded a reason we can read."
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

    // B6c first: the counter-intuitive win. The money was there all along and
    // nobody told her.
    if (credit || instalment?.credited_on) {
      const on = credit?.credited_on ?? instalment?.credited_on ?? "";
      return {
        blocker: "B6c", reason: "CREDITED",
        evidence: [{
          system: "mBANK", field: "Payment into your account",
          observed: "₹" + (credit?.amount ?? instalment?.amount ?? 2000) + " received on " + on,
          expected: "A payment for this instalment",
          note: "This instalment was already paid into your account. Check your passbook for that date."
        }]
      };
    }

    if (bank?.account_state === "CLOSED") {
      return {
        blocker: "B6b", reason: "ACCOUNT_CLOSED",
        evidence: [{
          system: "mBANK", field: "Bank account",
          observed: "Closed",
          expected: "Open and in use",
          note: "The account on your record is closed, so your bank sent the payment back."
        }]
      };
    }

    if (bank?.account_state === "DORMANT") {
      return {
        blocker: "B6b", reason: "ACCOUNT_DORMANT",
        evidence: [{
          system: "mBANK", field: "Bank account",
          observed: "Dormant — unused for too long",
          expected: "Open and in use",
          note: "Your account has gone dormant, so your bank returned the payment. It has to be made active again before the money can arrive."
        }]
      };
    }

    if (pfms?.fto_state === "REJECTED") {
      return {
        blocker: "B6b", reason: "BANK_RETURNED",
        evidence: [{
          system: "mBANK", field: "Payment attempt",
          observed: "Returned by your bank",
          expected: "Accepted by your bank",
          note: "Your bank returned the payment. Your account details need correcting."
        }]
      };
    }

    const expectedBy = instalment ? addDays(instalment.released_on, 7) : null;
    const waiting = (reason: ReasonCode, observed: string, note: string): RuleHit => ({
      blocker: "B6a", reason,
      evidence: [{
        system: "mPFMS", field: "Payment progress",
        observed,
        expected: "Paid into your account",
        note: note + (expectedBy ? " Expected by " + expectedBy + "." : "")
      }]
    });

    switch (pfms?.fto_state) {
      case "GENERATED":
        return waiting("FTO_IN_QUEUE", "Approved and in the payment queue",
          "Your money has been approved and is on its way.");
      case "RFT_SIGNED":
        return waiting("RFT_SIGNED", "Your state has signed and forwarded the request",
          "Your state has approved this and passed it on. Nothing is stuck.");
      case "SETTLEMENT_PENDING":
      case "PAID":
        return waiting("SETTLEMENT_PENDING", "Sent, waiting to settle at your bank",
          "The money has been sent and is settling at your bank.");
      default:
        return waiting("NOT_YET_QUEUED", "Not yet placed in the payment queue",
          "Your payment has not been put in the queue for this instalment yet.");
    }
  }
};

/** In precedence order. The caller walks this and stops at the first hit. */
export const RULES: readonly Rule[] = [b1, b2, b3, b4, b5, b6];
