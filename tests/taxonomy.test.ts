/* E4 — one taxonomy, and the real portal vocabulary.
 *
 * `lib/types/blocker.ts`, `engine/precedence.ts` and `content/statusCodes.json`
 * are deleted. `lib/types/diagnosis.ts` is the sole authority. These tests stop
 * the second taxonomy growing back. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";

import { RAIL_GATES, stoppedAt } from "../lib/types/diagnosis";
import type { BlockerCode } from "../lib/types/diagnosis";
import { PERSONAS } from "../mocks/fixtures";

const ROOT = path.join(__dirname, "..", "..");
const catalogue = (loc: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue." + loc + ".json"), "utf8")) as Record<string, string>;

/** The seven real strings a farmer will actually have seen (§3.2). */
const PORTAL_STRINGS = [
  "FTO Generated, Payment Under Process",
  "Rft Signed by State Government",
  "Rejected by Bank",
  "Stopped by State",
  "eKYC Required",
  "Aadhaar Seeding Status: No",
  "Payment Success"
];

describe("E4 — the deleted taxonomy stays deleted", () => {
  for (const f of ["lib/types/blocker.ts", "engine/precedence.ts", "content/statusCodes.json"]) {
    it("has no " + f, () => {
      assert.equal(fs.existsSync(path.join(ROOT, f)), false, f + " is back");
    });
  }

  it("keeps invented status codes out of the content layer", () => {
    // FTO_REJECTED and NPCI_UNMAPPED were ours, not the government's.
    for (const loc of ["en", "hi", "ta"]) {
      const text = JSON.stringify(catalogue(loc));
      for (const invented of ["FTO_REJECTED", "NPCI_UNMAPPED", "AADHAAR_NOT_SEEDED", "EKYC_OTP_UNAVAILABLE", "ITD_EXCLUDED", "LAND_MISMATCH", "ACCOUNT_INACTIVE"]) {
        assert.equal(text.includes(invented), false, loc + " still carries " + invented);
      }
    }
  });

  it("keeps keys that encode the old blocker numbering out of the catalogue", () => {
    // cause.b2.aadhaar_not_seeded called Aadhaar seeding B2; §7.2 says B4.
    for (const loc of ["en", "hi", "ta"]) {
      for (const key of Object.keys(catalogue(loc))) {
        assert.equal(/^(cause|action)\.b\d/.test(key), false, loc + " key " + key + " encodes the deleted taxonomy");
      }
    }
  });
});

describe("E4 — the real portal vocabulary (§3.2)", () => {
  it("every persona carries one of the seven real strings", () => {
    for (const p of PERSONAS) {
      assert.ok(PORTAL_STRINGS.includes(p.mSCHEME!.status_string), p.label + ": " + p.mSCHEME!.status_string);
    }
  });

  it("the personas exercise most of the real vocabulary", () => {
    const used = new Set(PERSONAS.map((p) => p.mSCHEME!.status_string));
    assert.ok(used.size >= 5, "only " + used.size + " distinct portal strings in play");
  });

  it("portal strings never appear in farmer-facing copy", () => {
    // They belong in portalStatus, quoted as mono secondary text on S4 (§11.7),
    // and nowhere else. Our prose says outcomes, not system vocabulary (§16.5).
    for (const loc of ["en", "hi", "ta"]) {
      const values = Object.entries(catalogue(loc));
      for (const [key, value] of values) {
        for (const s of PORTAL_STRINGS) {
          assert.equal(value.includes(s), false, loc + " " + key + " quotes a portal string");
        }
      }
    }
  });

  it("keeps banned system vocabulary out of every catalogue value", () => {
    const BANNED = /\b(npci|fto|mapper|seeding|seeded|dbt|pfms|rft)\b/i;
    for (const loc of ["en", "hi", "ta"]) {
      for (const [key, value] of Object.entries(catalogue(loc))) {
        assert.equal(BANNED.test(value), false, loc + " " + key + ": " + value);
      }
    }
  });
});

describe("E4 — the Money Rail runs on §11.2", () => {
  it("has exactly seven gates", () => {
    assert.equal(RAIL_GATES.length, 7);
    assert.deepEqual([...RAIL_GATES], [
      "REGISTERED", "ELIGIBLE", "IDENTITY_VERIFIED", "STATE_SIGNED",
      "PAYMENT_FILE", "BANK_LINKED", "CREDITED"
    ]);
  });

  it("labels all seven from the content layer, in all three locales", () => {
    const keys = ["rail.registered", "rail.eligible", "rail.identity", "rail.state_signed",
                  "rail.payment_file", "rail.bank_linked", "rail.credited"];
    for (const loc of ["en", "hi", "ta"]) {
      const c = catalogue(loc);
      for (const k of keys) assert.ok(c[k] && c[k].length > 0, loc + " missing " + k);
    }
  });

  it("maps every blocker to a gate", () => {
    const blockers: BlockerCode[] = ["B0", "B1", "B2", "B3", "B4", "B5", "B6a", "B6b", "B6c"];
    for (const b of blockers) {
      const i = stoppedAt(b);
      assert.ok(i >= -1 && i <= RAIL_GATES.length, b + " -> " + i);
    }
  });

  it("puts the state gate before the bank-link gate, though B4 is judged first", () => {
    // §11.2: rail order is deliberately not rule precedence. B4 is evaluated
    // before B5 because an unpayable account is more actionable, but the money
    // physically stops at the state gate earlier in the pipeline.
    assert.ok(stoppedAt("B5") < stoppedAt("B4"), "B5 gate sits before B4 gate");
  });

  it("clears every gate for a credited case", () => {
    assert.equal(stoppedAt("B6c"), RAIL_GATES.length);
  });

  it("has no known position for an indeterminate case", () => {
    assert.equal(stoppedAt("B0"), -1);
  });
});

describe("E4 — catalogue integrity", () => {
  it("keeps identical key sets across all three locales", () => {
    const [en, hi, ta] = ["en", "hi", "ta"].map((l) => Object.keys(catalogue(l)).sort());
    assert.deepEqual(hi, en);
    assert.deepEqual(ta, en);
  });

  it("uses only slots the engine can actually fill", () => {
    // A slot the engine never supplies renders as an em dash forever, which is
    // a silent hole in a sentence rather than a loud failure. Every name here
    // is produced by Diagnosis.facts or by Evidence.slots.
    const KNOWN = new Set([
      // from Diagnosis.facts
      "amount", "cycle", "reg_no", "name", "village", "state", "released_on",
      "rejection_reason", "aadhaar_name", "land_owner_name", "khata_id",
      "account_ref", "ifsc", "bank_name", "credited_on", "last4", "expected_by",
      "blocker", "reason_code", "stopped_at", "days_overdue",
      // from Evidence.slots
      "reason", "year", "pension", "threshold", "acquired_on", "cutoff",
      "on_record", "on_aadhaar", "other_bank", "land_name", "date", "cleared",
      // structural
      "code", "days"
    ]);
    for (const [k, v] of Object.entries(catalogue("en"))) {
      for (const raw of v.match(/\{(\w+)\}/g) ?? []) {
        const slot = raw.slice(1, -1);
        assert.ok(KNOWN.has(slot), k + " uses unknown slot {" + slot + "}");
      }
    }
  });
});
