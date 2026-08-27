/* Synthetic beneficiary fixtures for the Mock Government Systems Layer.
 *
 * Every person here is invented. Identifier formats follow §12.3 and are
 * structurally invalid as real credentials. §12.3 also forbids generating data
 * that mimics a real identifiable individual — no real village plus real name
 * combinations, even from publicly downloadable beneficiary lists.
 *
 * §8.4: deliberate inconsistency is the point. The same person carries
 * different name spellings across mUIDAI, mLAND and mBANK, because that is what
 * actually happens. The engine's job is to notice and name it. Do not seed
 * clean data and add faults later.
 *
 * E1 seeds the canonical persona so the layer is verifiable end to end.
 * TODO(E2): the remaining seven personas from §8.4. */

import type {
  BankRecord, ItdRecord, LandRecord, NpciRecord, PfmsRecord, SchemeRecord, UidaiRecord
} from "../lib/types/systems";

export interface PersonaFixture {
  /** Internal reference. Not shown to a user. */
  ref: string;
  label: string;
  /** Which blocker this persona exists to demonstrate (§8.4). */
  demonstrates: string;
  mSCHEME: SchemeRecord | null;
  mUIDAI: UidaiRecord | null;
  mPFMS: PfmsRecord | null;
  mNPCI: NpciRecord | null;
  mLAND: LandRecord | null;
  mBANK: BankRecord | null;
  mITD: ItdRecord | null;
}

/** The instalment under diagnosis. 23rd, released 20 Jun 2026 (§3.1). */
export const CURRENT_CYCLE = "2026-23";

const LAKSHMI: PersonaFixture = {
  ref: "P1",
  label: "Lakshmi D.",
  demonstrates: "B3 e-KYC incomplete, Aadhaar mobile not linked — the OTP route is dead",
  mSCHEME: {
    reg_no: "NSHDEMO-1001",
    name: "Lakshmi Devi",
    village: "Ariyur",
    state: "Tamil Nadu",
    registration_state: "REGISTERED",
    status_string: "eKYC Required",
    instalments: [
      { cycle: "2025-19", amount: 2000, released_on: "2025-06-20", credited_on: "2025-06-24" },
      { cycle: "2025-20", amount: 2000, released_on: "2025-10-20", credited_on: "2025-10-23" },
      { cycle: "2026-21", amount: 2000, released_on: "2026-02-20", credited_on: "2026-02-25" },
      { cycle: "2026-22", amount: 2000, released_on: "2026-04-20", credited_on: "2026-04-24" },
      { cycle: CURRENT_CYCLE, amount: 2000, released_on: "2026-06-20", credited_on: null }
    ]
  },
  mUIDAI: {
    aadhaar_ref: "9999 4412 8830",
    name: "Lakshmi Devi",
    dob: "1972-03-14",
    gender: "F",
    // The signature insight (§7.3): no mobile is linked, so an OTP can never
    // arrive. Recommending OTP e-KYC here is the single most common piece of
    // bad advice in this domain, and the portal gives it by default.
    linked_mobile: null,
    ekyc_state: "PENDING"
  },
  mPFMS: {
    fto_id: null,
    fto_state: "NOT_QUEUED",
    beneficiary_validation: "PENDING",
    govt_employee_flag: false
  },
  mNPCI: {
    aadhaar_ref: "9999 4412 8830",
    mapped_bank: "MOCK BANK OF THE SOUTH",
    mapper_state: "ACTIVE"
  },
  mLAND: {
    khata_id: "KH-88231",
    // Benign spelling variance against mUIDAI "Lakshmi Devi". The B5 rule
    // normalises this and correctly does NOT flag it — the engine noticing the
    // difference and declining to call it a mismatch is the behaviour under test.
    owner_name: "Lakshmi D.",
    extent: 1.2,
    acquired_on: "2011-08-02",
    seeded: true
  },
  mBANK: {
    account_ref: "MOCKACC-4471",
    ifsc: "MOCK0000001",
    account_state: "ACTIVE",
    credits: [
      { cycle: "2026-22", amount: 2000, credited_on: "2026-04-24", account_last4: "4471" }
    ]
  },
  mITD: {
    pan_ref: "MOCKP0001M",
    is_taxpayer: false,
    assessment_year: "2025-26"
  }
};

export const PERSONAS: PersonaFixture[] = [LAKSHMI];

/* ── Lookup ──────────────────────────────────────────────────────────────────
   §11.7 S2: any one of Aadhaar, mobile or registration number is enough. P2 is
   that farmers do not hold a registration number, so it is never a precondition.
   Comparison ignores spacing and case so "9999 4412 8830" and "999944128830"
   both resolve. ------------------------------------------------------------ */

function squash(v: string): string {
  return v.replace(/[\s\-+]/g, "").toLowerCase();
}

export function findPersonaByRef(ref: string): PersonaFixture | null {
  const q = squash(ref);
  return PERSONAS.find((p) => squash(p.ref) === q) ?? null;
}

export function findPersonaByIdentifier(identifier: string): PersonaFixture | null {
  const q = squash(identifier);
  if (!q) return null;
  return (
    PERSONAS.find((p) =>
      squash(p.ref) === q ||
      (p.mUIDAI ? squash(p.mUIDAI.aadhaar_ref) === q : false) ||
      (p.mUIDAI?.linked_mobile ? squash(p.mUIDAI.linked_mobile) === q : false) ||
      (p.mSCHEME ? squash(p.mSCHEME.reg_no) === q : false)
    ) ?? null
  );
}
