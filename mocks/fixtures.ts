/* Synthetic beneficiary fixtures for the Mock Government Systems Layer.
 *
 * Every person here is invented. Identifier formats follow §12.3 and are
 * structurally invalid as real credentials. §12.3 also forbids generating data
 * that mimics a real identifiable individual - no real village plus real name
 * combination, even from publicly downloadable beneficiary lists. Village names
 * here are ordinary Tamil place-names attached to invented people.
 *
 * §8.4: DELIBERATE INCONSISTENCY IS THE POINT. The same person carries different
 * name spellings across mUIDAI, mLAND and mBANK, and one carries a transposed
 * date of birth, because that is what actually happens. The engine's job is to
 * notice, and to know which differences matter. Do not "clean this up".
 *
 * Two kinds of name difference are seeded, and they are not the same thing:
 *   - BENIGN VARIANCE  - "Ramesh P." vs "Ramesh Pandian". Same person, and the
 *                        B5 rule must normalise it and NOT flag it.
 *   - REAL MISMATCH    - land still in a late father's name. Different person,
 *                        and B5 must flag it.
 * A rule that cannot tell these apart sends someone to the wrong office. */

import type {
  BankRecord, ItdRecord, LandRecord, NpciRecord, PfmsRecord, SchemeRecord, UidaiRecord
} from "../lib/types/systems";

export interface PersonaFixture {
  ref: string;
  label: string;
  /** The verdict the engine must return. E5 table-drives off this, and E3 is
   *  wrong if any persona returns anything else. */
  expects: { blocker: string; reason: string };
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
export const CURRENT_RELEASE = "2026-06-20";

/** Instalments 19-22 paid, the 23rd outstanding - the shape of every persona
 *  except Govindan, who was in fact paid. */
function paidThrough22(): SchemeRecord["instalments"] {
  return [
    { cycle: "2025-19", amount: 2000, released_on: "2025-06-20", credited_on: "2025-06-24" },
    { cycle: "2025-20", amount: 2000, released_on: "2025-10-20", credited_on: "2025-10-23" },
    { cycle: "2026-21", amount: 2000, released_on: "2026-02-20", credited_on: "2026-02-25" },
    { cycle: "2026-22", amount: 2000, released_on: "2026-04-20", credited_on: "2026-04-24" },
    { cycle: CURRENT_CYCLE, amount: 2000, released_on: CURRENT_RELEASE, credited_on: null }
  ];
}

function creditsThrough22(last4: string): BankRecord["credits"] {
  return [
    { cycle: "2026-21", amount: 2000, credited_on: "2026-02-25", account_last4: last4 },
    { cycle: "2026-22", amount: 2000, credited_on: "2026-04-24", account_last4: last4 }
  ];
}

/* ── P1 · Lakshmi D. - B3, e-KYC pending and no Aadhaar-linked mobile ────────
   The canonical case. Self-serve in principle, but the OTP route is dead: no
   mobile is linked, so the code can never arrive. §7.3 calls recommending OTP
   e-KYC here the single most common piece of bad advice in this domain, and the
   portal gives it by default. ---------------------------------------------- */
const LAKSHMI: PersonaFixture = {
  ref: "P1",
  label: "Lakshmi D.",
  expects: { blocker: "B3", reason: "MOBILE_NOT_LINKED" },
  mSCHEME: {
    reg_no: "NSHDEMO-1001", name: "Lakshmi Devi", village: "Ariyur", state: "Tamil Nadu",
    registration_state: "REGISTERED", status_string: "eKYC Required",
    dob_on_record: "1972-03-14", instalments: paidThrough22()
  },
  mUIDAI: {
    aadhaar_ref: "9999 4412 8830", name: "Lakshmi Devi", dob: "1972-03-14", gender: "F",
    linked_mobile: null, ekyc_state: "PENDING"
  },
  mPFMS: { fto_id: null, fto_state: "NOT_QUEUED", beneficiary_validation: "PENDING", govt_employee_flag: false },
  mNPCI: { aadhaar_ref: "9999 4412 8830", mapped_bank: "MOCK BANK OF THE SOUTH", mapper_state: "ACTIVE" },
  // Benign variance against "Lakshmi Devi". Must NOT be flagged as B5.
  mLAND: { khata_id: "KH-88231", owner_name: "Lakshmi D.", extent: 1.2, acquired_on: "2011-08-02", seeded: true },
  mBANK: { account_ref: "MOCKACC-4471", ifsc: "MOCK0000001", account_state: "ACTIVE", credits: creditsThrough22("4471") },
  mITD: { pan_ref: "MOCKP0001M", is_taxpayer: false, assessment_year: "2025-26" }
};

/* ── P2 · Ramesh P. - B4, Aadhaar-to-account mapper inactive ─────────────────
   "The money has nowhere to land" - §8.4 calls this the best explanation line
   in the product. Everything upstream succeeded; the money is approved and
   cannot be delivered. ----------------------------------------------------- */
const RAMESH: PersonaFixture = {
  ref: "P2",
  label: "Ramesh P.",
  expects: { blocker: "B4", reason: "MAPPER_INACTIVE" },
  mSCHEME: {
    reg_no: "NSHDEMO-1002", name: "Ramesh Pandian", village: "Kootampuli", state: "Tamil Nadu",
    registration_state: "REGISTERED", status_string: "Aadhaar Seeding Status: No",
    dob_on_record: "1968-11-02", instalments: paidThrough22()
  },
  mUIDAI: {
    aadhaar_ref: "9999 5107 2264", name: "Ramesh Pandian", dob: "1968-11-02", gender: "M",
    linked_mobile: "+91 5220148876", ekyc_state: "COMPLETE"
  },
  mPFMS: { fto_id: "FTO-2026-23-0042", fto_state: "GENERATED", beneficiary_validation: "PASS", govt_employee_flag: false },
  mNPCI: { aadhaar_ref: "9999 5107 2264", mapped_bank: null, mapper_state: "INACTIVE" },
  // Benign variance. B4 outranks B5 anyway, but this must not be flagged at all.
  mLAND: { khata_id: "KH-11907", owner_name: "Ramesh P.", extent: 2.4, acquired_on: "2009-04-17", seeded: true },
  mBANK: { account_ref: "MOCKACC-5580", ifsc: "MOCK0000001", account_state: "ACTIVE", credits: creditsThrough22("5580") },
  mITD: { pan_ref: "MOCKP0002M", is_taxpayer: false, assessment_year: "2025-26" }
};

/* ── P3 · Sarala M. - B5, land record in her late father's name ──────────────
   A REAL mismatch, not a spelling variance: the land was never mutated after
   her father died. Needs a revenue officer, so this is the persona that earns a
   grievance and an SLA clock. ---------------------------------------------- */
const SARALA: PersonaFixture = {
  ref: "P3",
  label: "Sarala M.",
  expects: { blocker: "B5", reason: "LAND_NAME_MISMATCH" },
  mSCHEME: {
    reg_no: "NSHDEMO-1003", name: "Sarala Murugesan", village: "Vellakoil", state: "Tamil Nadu",
    registration_state: "REGISTERED", status_string: "Stopped by State",
    dob_on_record: "1979-07-23", instalments: paidThrough22()
  },
  mUIDAI: {
    aadhaar_ref: "9999 6338 4915", name: "Sarala Murugesan", dob: "1979-07-23", gender: "F",
    linked_mobile: "+91 5331067742", ekyc_state: "COMPLETE"
  },
  mPFMS: { fto_id: null, fto_state: "NOT_QUEUED", beneficiary_validation: "PENDING", govt_employee_flag: false },
  mNPCI: { aadhaar_ref: "9999 6338 4915", mapped_bank: "MOCK GRAMEEN BANK", mapper_state: "ACTIVE" },
  // Her late father. A different person, not a spelling of hers.
  mLAND: { khata_id: "KH-40552", owner_name: "Murugesan Kandasamy", extent: 0.8, acquired_on: "2003-01-30", seeded: true },
  mBANK: { account_ref: "MOCKACC-6692", ifsc: "MOCK0000002", account_state: "ACTIVE", credits: creditsThrough22("6692") },
  mITD: { pan_ref: "MOCKP0003M", is_taxpayer: false, assessment_year: "2025-26" }
};

/* ── P4 · Anbu K. - B6a, in flight ───────────────────────────────────────────
   Teaches that "not broken, just waiting" is an answer.

   ALSO THE CARVE-OUT REGRESSION TEST. Anbu is a government employee AND
   Multi-Tasking Staff / Class IV / Group D, who are EXCLUDED FROM THE
   EXCLUSION. If the B2 rule ever drops that carve-out, Anbu flips from B6a to
   B2 and the suite fails loudly - which is the point. A wrongly excluded farmer
   is the most expensive error this engine can make. ------------------------ */
const ANBU: PersonaFixture = {
  ref: "P4",
  label: "Anbu K.",
  expects: { blocker: "B6a", reason: "FTO_IN_QUEUE" },
  mSCHEME: {
    reg_no: "NSHDEMO-1004", name: "Anbu Kannan", village: "Thirumangalam", state: "Tamil Nadu",
    registration_state: "REGISTERED", status_string: "FTO Generated, Payment Under Process",
    dob_on_record: "1985-02-09", instalments: paidThrough22()
  },
  mUIDAI: {
    aadhaar_ref: "9999 7205 1178", name: "Anbu Kannan", dob: "1985-02-09", gender: "M",
    linked_mobile: "+91 5448219903", ekyc_state: "COMPLETE"
  },
  mPFMS: {
    fto_id: "FTO-2026-23-0187", fto_state: "GENERATED", beneficiary_validation: "PASS",
    govt_employee_flag: true, is_mts_class_iv_group_d: true
  },
  mNPCI: { aadhaar_ref: "9999 7205 1178", mapped_bank: "MOCK BANK OF THE SOUTH", mapper_state: "ACTIVE" },
  mLAND: { khata_id: "KH-23310", owner_name: "Anbu K.", extent: 1.7, acquired_on: "2014-06-11", seeded: true },
  mBANK: { account_ref: "MOCKACC-7703", ifsc: "MOCK0000001", account_state: "ACTIVE", credits: creditsThrough22("7703") },
  mITD: { pan_ref: "MOCKP0004M", is_taxpayer: false, assessment_year: "2025-26" }
};

/* ── P5 · Fatima B. - B6b, bank returned the payment ─────────────────────────
   Account went dormant through disuse, so the credit bounced. Everything else
   is correct, which is why the portal's "Rejected by Bank" tells her nothing.
   Carries a spelling variance across mLAND too. ---------------------------- */
const FATIMA: PersonaFixture = {
  ref: "P5",
  label: "Fatima B.",
  expects: { blocker: "B6b", reason: "ACCOUNT_DORMANT" },
  mSCHEME: {
    reg_no: "NSHDEMO-1005", name: "Fatima Begum", village: "Ambur", state: "Tamil Nadu",
    registration_state: "REGISTERED", status_string: "Rejected by Bank",
    dob_on_record: "1963-12-05", instalments: paidThrough22()
  },
  mUIDAI: {
    aadhaar_ref: "9999 8114 6032", name: "Fatima Begum", dob: "1963-12-05", gender: "F",
    linked_mobile: "+91 5556730218", ekyc_state: "COMPLETE"
  },
  mPFMS: { fto_id: "FTO-2026-23-0091", fto_state: "REJECTED", beneficiary_validation: "PASS", govt_employee_flag: false },
  mNPCI: { aadhaar_ref: "9999 8114 6032", mapped_bank: "MOCK GRAMEEN BANK", mapper_state: "ACTIVE" },
  // Benign transliteration variance - "Fathima" vs "Fatima". Must NOT be B5.
  mLAND: { khata_id: "KH-67018", owner_name: "Fathima Begum", extent: 1.1, acquired_on: "2007-11-22", seeded: true },
  mBANK: { account_ref: "MOCKACC-8814", ifsc: "MOCK0000002", account_state: "DORMANT", credits: creditsThrough22("8814") },
  mITD: { pan_ref: "MOCKP0005M", is_taxpayer: false, assessment_year: "2025-26" }
};

/* ── P6 · Govindan S. - B6c, already credited ────────────────────────────────
   The counter-intuitive win: the money was there all along. He has a passbook
   he cannot read and no SMS, so nobody told him. The terminal success state. */
const GOVINDAN: PersonaFixture = {
  ref: "P6",
  label: "Govindan S.",
  expects: { blocker: "B6c", reason: "CREDITED" },
  mSCHEME: {
    reg_no: "NSHDEMO-1006", name: "Govindan Subramani", village: "Sirkazhi", state: "Tamil Nadu",
    registration_state: "REGISTERED", status_string: "Payment Success",
    dob_on_record: "1958-04-30",
    instalments: [
      ...paidThrough22().slice(0, 4),
      { cycle: CURRENT_CYCLE, amount: 2000, released_on: CURRENT_RELEASE, credited_on: "2026-06-24" }
    ]
  },
  mUIDAI: {
    aadhaar_ref: "9999 2960 7743", name: "Govindan Subramani", dob: "1958-04-30", gender: "M",
    linked_mobile: "+91 5663892041", ekyc_state: "COMPLETE"
  },
  mPFMS: { fto_id: "FTO-2026-23-0003", fto_state: "PAID", beneficiary_validation: "PASS", govt_employee_flag: false },
  mNPCI: { aadhaar_ref: "9999 2960 7743", mapped_bank: "MOCK BANK OF THE SOUTH", mapper_state: "ACTIVE" },
  mLAND: { khata_id: "KH-90114", owner_name: "Govindan S.", extent: 2.0, acquired_on: "1998-03-15", seeded: true },
  mBANK: {
    account_ref: "MOCKACC-9925", ifsc: "MOCK0000001", account_state: "ACTIVE",
    credits: [...creditsThrough22("9925"), { cycle: CURRENT_CYCLE, amount: 2000, credited_on: "2026-06-24", account_last4: "9925" }]
  },
  mITD: { pan_ref: "MOCKP0006M", is_taxpayer: false, assessment_year: "2025-26" }
};

/* ── P7 · Murugan V. - B2, flagged as an income-tax payer ────────────────────
   Contestable. The tax flag is frequently a stale or mistaken PAN match, and
   §7.2 says an exclusion "can be challenged" - so this persona drives the
   evidence path rather than a dead end. ------------------------------------ */
const MURUGAN: PersonaFixture = {
  ref: "P7",
  label: "Murugan V.",
  expects: { blocker: "B2", reason: "INCOME_TAX_PAYER" },
  mSCHEME: {
    reg_no: "NSHDEMO-1007", name: "Murugan Velayudham", village: "Palladam", state: "Tamil Nadu",
    registration_state: "REGISTERED", status_string: "Stopped by State",
    dob_on_record: "1974-09-18", instalments: paidThrough22()
  },
  mUIDAI: {
    aadhaar_ref: "9999 3471 5528", name: "Murugan Velayudham", dob: "1974-09-18", gender: "M",
    linked_mobile: "+91 5774015586", ekyc_state: "COMPLETE"
  },
  mPFMS: { fto_id: null, fto_state: "NOT_QUEUED", beneficiary_validation: "FAIL", govt_employee_flag: false },
  mNPCI: { aadhaar_ref: "9999 3471 5528", mapped_bank: "MOCK GRAMEEN BANK", mapper_state: "ACTIVE" },
  mLAND: { khata_id: "KH-55820", owner_name: "Murugan V.", extent: 3.1, acquired_on: "2005-09-08", seeded: true },
  mBANK: { account_ref: "MOCKACC-1036", ifsc: "MOCK0000003", account_state: "ACTIVE", credits: creditsThrough22("1036") },
  mITD: { pan_ref: "MOCKP0007M", is_taxpayer: true, assessment_year: "2025-26" }
};

/* ── P8 · Selvi R. - B1 + B3 + B4 + B5, and only B1 may be returned ──────────
   THE PRECEDENCE TEST. Four blockers are live at once:
     B1  registration rejected                        ← the only correct verdict
     B3  e-KYC not started, no linked mobile, and a transposed date of birth
     B4  mapper not found
     B5  land in her father's name
   The portal shows her "eKYC Required" - a lower-precedence symptom - which is
   exactly the failure NISHAN exists to correct. Fixing her e-KYC would waste a
   trip: she is not registered, so no instalment can be paid regardless. ---- */
const SELVI: PersonaFixture = {
  ref: "P8",
  label: "Selvi R.",
  expects: { blocker: "B1", reason: "REGISTRATION_REJECTED" },
  mSCHEME: {
    reg_no: "NSHDEMO-1008", name: "Selvi Ramanathan", village: "Aruppukottai", state: "Tamil Nadu",
    registration_state: "REJECTED",
    rejection_reason: "Land ownership not verified by the revenue office",
    // The portal shows the e-KYC symptom, not the registration cause.
    status_string: "eKYC Required",
    // Transposed against Aadhaar's 1991-03-08 - the common real data-entry error.
    dob_on_record: "1991-08-03",
    instalments: [
      { cycle: CURRENT_CYCLE, amount: 2000, released_on: CURRENT_RELEASE, credited_on: null }
    ]
  },
  mUIDAI: {
    aadhaar_ref: "9999 1826 9304", name: "Selvi Ramanathan", dob: "1991-03-08", gender: "F",
    linked_mobile: null, ekyc_state: "NOT_STARTED"
  },
  mPFMS: { fto_id: null, fto_state: "NOT_QUEUED", beneficiary_validation: "FAIL", govt_employee_flag: false },
  mNPCI: { aadhaar_ref: "9999 1826 9304", mapped_bank: null, mapper_state: "NOT_FOUND" },
  mLAND: { khata_id: "KH-70493", owner_name: "Ramanathan Perumal", extent: 0.6, acquired_on: "2021-05-19", seeded: false },
  mBANK: { account_ref: "MOCKACC-2147", ifsc: "MOCK0000004", account_state: "ACTIVE", credits: [] },
  mITD: { pan_ref: "MOCKP0008M", is_taxpayer: false, assessment_year: "2025-26" }
};

export const PERSONAS: PersonaFixture[] = [
  LAKSHMI, RAMESH, SARALA, ANBU, FATIMA, GOVINDAN, MURUGAN, SELVI
];

/* ── Lookup ──────────────────────────────────────────────────────────────────
   §11.7 S2: any one of Aadhaar, mobile or registration number is enough. P2 is
   that farmers do not hold a registration number, so it is never a
   precondition. Comparison ignores spacing, case and separators so
   "9999 4412 8830" and "999944128830" both resolve. ------------------------ */

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
