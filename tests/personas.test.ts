/* E2 — the eight persona fixtures (§8.4).
 *
 * The credential-shape suite at the bottom is the one that matters most: a
 * judge may hit /api/mock/* directly, and nothing it returns may resemble a
 * real credential. §12.3 and §2.3 both forbid it, and §12.9 treats a leak of
 * real personal data as an incident. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SYSTEM_CODES } from "../lib/types/systems";
import { PERSONAS, findPersonaByIdentifier } from "../mocks/fixtures";
import { readSnapshot } from "../mocks";

describe("E2 — persona coverage (§8.4)", () => {
  it("seeds all eight personas with stable refs", () => {
    assert.equal(PERSONAS.length, 8);
    assert.deepEqual(PERSONAS.map((p) => p.ref), ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]);
  });

  it("covers every blocker in the §8.4 demo table", () => {
    const blockers = PERSONAS.map((p) => p.expects.blocker).sort();
    assert.deepEqual(blockers, ["B1", "B2", "B3", "B4", "B5", "B6a", "B6b", "B6c"]);
  });

  it("gives every persona a record in all seven systems", async () => {
    for (const p of PERSONAS) {
      for (const code of SYSTEM_CODES) {
        assert.notEqual(p[code], null, p.label + " missing " + code);
      }
      const snap = await readSnapshot(p.ref);
      for (const code of SYSTEM_CODES) {
        assert.equal(snap[code].ok, true, p.label + " " + code + " reachable");
        assert.ok(snap[code].ok && snap[code].record, p.label + " " + code + " has a record");
      }
    }
  });

  it("keeps every identifier unique across personas", () => {
    const seen = new Set<string>();
    for (const p of PERSONAS) {
      for (const id of [p.mUIDAI?.aadhaar_ref, p.mSCHEME?.reg_no, p.mBANK?.account_ref, p.mITD?.pan_ref, p.mUIDAI?.linked_mobile]) {
        if (!id) continue;
        assert.equal(seen.has(id), false, "duplicate identifier " + id);
        seen.add(id);
      }
    }
  });

  it("resolves every persona by Aadhaar and by registration number", () => {
    for (const p of PERSONAS) {
      assert.equal(findPersonaByIdentifier(p.mUIDAI!.aadhaar_ref)?.ref, p.ref, p.label + " by Aadhaar");
      assert.equal(findPersonaByIdentifier(p.mSCHEME!.reg_no)?.ref, p.ref, p.label + " by reg no");
      if (p.mUIDAI!.linked_mobile) {
        assert.equal(findPersonaByIdentifier(p.mUIDAI!.linked_mobile)?.ref, p.ref, p.label + " by mobile");
      }
    }
  });
});

describe("E2 — deliberate cross-system inconsistency (§8.4)", () => {
  const byRef = (r: string) => PERSONAS.find((p) => p.ref === r)!;

  it("seeds benign name variance that B5 must NOT flag", () => {
    // Same person, shorter form. A rule that flags these sends people to the
    // revenue office for nothing.
    for (const ref of ["P1", "P2", "P4", "P6", "P7"]) {
      const p = byRef(ref);
      assert.notEqual(p.mLAND!.owner_name, p.mUIDAI!.name, p.label + " land name should differ in form");
      const surnameish = p.mUIDAI!.name.split(" ")[0];
      assert.ok(p.mLAND!.owner_name.startsWith(surnameish), p.label + " but share the leading name");
    }
  });

  it("seeds a transliteration variance (Fatima / Fathima) that B5 must NOT flag", () => {
    const p = byRef("P5");
    assert.equal(p.mUIDAI!.name, "Fatima Begum");
    assert.equal(p.mLAND!.owner_name, "Fathima Begum");
  });

  it("seeds real mismatches that B5 MUST flag", () => {
    // Land never mutated after a death — a different person entirely.
    assert.equal(byRef("P3").mLAND!.owner_name, "Murugesan Kandasamy");
    assert.equal(byRef("P8").mLAND!.owner_name, "Ramanathan Perumal");
    for (const ref of ["P3", "P8"]) {
      const p = byRef(ref);
      const first = p.mUIDAI!.name.split(" ")[0];
      assert.equal(p.mLAND!.owner_name.startsWith(first), false, p.label + " shares no leading name");
    }
  });

  it("seeds a transposed date of birth", () => {
    const p = byRef("P8");
    assert.equal(p.mUIDAI!.dob, "1991-03-08");
    assert.equal(p.mSCHEME!.dob_on_record, "1991-08-03");
    assert.notEqual(p.mUIDAI!.dob, p.mSCHEME!.dob_on_record);
  });

  it("seeds an inactive mapper and a not-found mapper", () => {
    assert.equal(byRef("P2").mNPCI!.mapper_state, "INACTIVE");
    assert.equal(byRef("P8").mNPCI!.mapper_state, "NOT_FOUND");
  });
});

describe("E2 — Selvi R. is the precedence case", () => {
  const selvi = PERSONAS.find((p) => p.ref === "P8")!;

  it("has four blockers live at once", () => {
    assert.equal(selvi.mSCHEME!.registration_state, "REJECTED", "B1");
    assert.equal(selvi.mUIDAI!.ekyc_state, "NOT_STARTED", "B3");
    assert.equal(selvi.mUIDAI!.linked_mobile, null, "B3 sub-cause");
    assert.equal(selvi.mNPCI!.mapper_state, "NOT_FOUND", "B4");
    assert.equal(selvi.mLAND!.seeded, false, "B5");
  });

  it("must resolve to B1 alone — E3 is wrong if it returns anything else", () => {
    assert.deepEqual(selvi.expects, { blocker: "B1", reason: "REGISTRATION_REJECTED" });
  });

  it("shows a lower-precedence symptom on the portal, which is the point", () => {
    // The official portal tells her to fix her e-KYC. Doing so would waste a
    // trip: she is not registered, so no instalment can be paid regardless.
    assert.equal(selvi.mSCHEME!.status_string, "eKYC Required");
  });
});

describe("E2 — Anbu K. guards the MTS / Class IV / Group D carve-out", () => {
  const anbu = PERSONAS.find((p) => p.ref === "P4")!;

  it("is a government employee who is exempt from the exclusion", () => {
    assert.equal(anbu.mPFMS!.govt_employee_flag, true);
    assert.equal(anbu.mPFMS!.is_mts_class_iv_group_d, true);
  });

  it("must NOT be excluded — he returns B6a, not B2", () => {
    // If the B2 rule ever drops the carve-out, this flips to B2 and fails loudly.
    // A wrongly excluded farmer is the most expensive error this engine can make.
    assert.equal(anbu.expects.blocker, "B6a");
  });
});

/* ── Credential-shape guarantee ──────────────────────────────────────────────
   Walks every string in every record of every persona. Nothing that leaves the
   MGSL — including straight out of /api/mock/* — may look like a real
   credential. §12.3. --------------------------------------------------------*/

/** Mask +91 dialling codes so a country code plus a 10-digit mobile is not
 *  mistaken for a 12-digit Aadhaar. Mobiles have their own assertion below. */
function maskDiallingCode(s: string): string {
  return s.replace(/\+91[\s-]?/g, "MOBILE:");
}

function everyString(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) everyString(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) everyString(v, out);
  return out;
}

describe("E2 — nothing resembles a real credential (§12.3)", () => {
  const strings = PERSONAS.flatMap((p) => SYSTEM_CODES.flatMap((c) => everyString(p[c])));

  it("collected a meaningful number of strings to check", () => {
    assert.ok(strings.length > 100, "scanned " + strings.length + " strings");
  });

  it("every 12-digit run is a 9999-prefixed synthetic Aadhaar", () => {
    for (const s of strings) {
      for (const m of maskDiallingCode(s).replace(/[\s-]/g, "").matchAll(/(?<!\d)\d{12}(?!\d)/g)) {
        assert.ok(m[0].startsWith("9999"), "non-synthetic 12-digit run: " + s);
      }
    }
  });

  it("every +91 number uses the unallocated 5-series", () => {
    for (const s of strings) {
      for (const m of s.matchAll(/\+91[\s-]?(\d)/g)) {
        assert.equal(m[1], "5", "real-looking mobile series in: " + s);
      }
    }
  });

  it("every IFSC-shaped token is MOCK-prefixed", () => {
    for (const s of strings) {
      for (const m of s.matchAll(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g)) {
        assert.ok(m[0].startsWith("MOCK"), "real-looking IFSC: " + m[0]);
      }
    }
  });

  it("every PAN-shaped token is MOCKP-prefixed", () => {
    for (const s of strings) {
      for (const m of s.matchAll(/\b[A-Z]{5}\d{4}[A-Z]\b/g)) {
        assert.ok(m[0].startsWith("MOCKP"), "real-looking PAN: " + m[0]);
      }
    }
  });

  it("every account reference is MOCKACC- and every registration NSHDEMO-", () => {
    for (const p of PERSONAS) {
      assert.match(p.mBANK!.account_ref, /^MOCKACC-\d{4}$/, p.label);
      assert.match(p.mSCHEME!.reg_no, /^NSHDEMO-\d{4}$/, p.label);
    }
  });

  it("holds the same guarantee on assembled snapshots, not just fixtures", async () => {
    for (const p of PERSONAS) {
      const snap = await readSnapshot(p.ref);
      for (const s of everyString(snap)) {
        for (const m of maskDiallingCode(s).replace(/[\s-]/g, "").matchAll(/(?<!\d)\d{12}(?!\d)/g)) {
          assert.ok(m[0].startsWith("9999"), "leaked via snapshot: " + s);
        }
      }
    }
  });
});
