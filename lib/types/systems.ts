/* Mock Government Systems Layer — record shapes.
 *
 * Fields follow CLAUDE.md §8.4. Every identifier uses a synthetic format from
 * §12.3 that is structurally invalid as a real credential, so nothing here can
 * be mistaken for or reused as real data.
 *
 * Nothing in this file touches a live government system (§16.6). */

export type SystemCode = "mSCHEME" | "mUIDAI" | "mPFMS" | "mNPCI" | "mLAND" | "mBANK" | "mITD";

export const SYSTEM_CODES: readonly SystemCode[] = ["mSCHEME", "mUIDAI", "mPFMS", "mNPCI", "mLAND", "mBANK", "mITD"];

/* ── Per-system records ──────────────────────────────────────────────────── */

/** The six status strings a farmer actually sees on the official portal (§3.2).
 *  Shown verbatim as mono secondary text so she can match what she was told. */
export type PortalStatusString =
  | "FTO Generated, Payment Under Process"
  | "Rft Signed by State Government"
  | "Rejected by Bank"
  | "Stopped by State"
  | "eKYC Required"
  | "Aadhaar Seeding Status: No"
  | "Payment Success";

export interface SchemeRecord {
  /** §12.3 format: NSHDEMO-#### */
  reg_no: string;
  name: string;
  village: string;
  state: string;
  /** Instalment history. The cycle under diagnosis is the last entry. */
  instalments: Instalment[];
  status_string: PortalStatusString;
  registration_state: "REGISTERED" | "PENDING" | "REJECTED";
  /** Populated only when registration_state is REJECTED. */
  rejection_reason?: string;
  /** Set when another family member holds the same land (§7.3 FAMILY_DUPLICATE). */
  family_duplicate_of?: string;
}

export interface Instalment {
  /** e.g. "2026-23" — the 23rd instalment, released 20 Jun 2026 (§3.1). */
  cycle: string;
  amount: number;
  released_on: string;
  credited_on: string | null;
}

export interface UidaiRecord {
  /** §12.3 format: 9999 XXXX XXXX — fails the real Verhoeff checksum by construction. */
  aadhaar_ref: string;
  name: string;
  dob: string;
  gender: "F" | "M" | "O";
  /** §12.3 format: +91 5XXXXXXXXX — the 5-series is not an allocated Indian series.
   *  null means no mobile is linked, which is why OTP e-KYC can never arrive (§7.3). */
  linked_mobile: string | null;
  ekyc_state: "COMPLETE" | "PENDING" | "NOT_STARTED";
}

export interface PfmsRecord {
  fto_id: string | null;
  fto_state: "NOT_QUEUED" | "GENERATED" | "RFT_SIGNED" | "SETTLEMENT_PENDING" | "PAID" | "REJECTED";
  beneficiary_validation: "PASS" | "FAIL" | "PENDING";
  govt_employee_flag: boolean;
  /** Monthly pension in rupees. §12.8/§3 exclusion threshold is 10,000. */
  pension_amount?: number;
  /** True for Multi-Tasking Staff / Class IV / Group D — EXCLUDED FROM THE
   *  EXCLUSION. This carve-out is what makes a wrong B2 flag contestable. */
  is_mts_class_iv_group_d?: boolean;
}

export interface NpciRecord {
  aadhaar_ref: string;
  mapped_bank: string | null;
  mapper_state: "ACTIVE" | "INACTIVE" | "NOT_FOUND" | "DIFFERENT_BANK";
}

export interface LandRecord {
  khata_id: string;
  /** Deliberately spelled differently from UidaiRecord.name for some personas —
   *  that mismatch is the B5 signal, and it is what really happens (§8.4). */
  owner_name: string;
  /** Acres. */
  extent: number;
  /** Land acquired after 2019-02-01 falls outside the scheme cutoff (§7.3). */
  acquired_on: string;
  seeded: boolean;
}

export interface BankRecord {
  /** §12.3 format: MOCKACC-#### — non-numeric, cannot be pasted anywhere real. */
  account_ref: string;
  /** §12.3 format: MOCK0000001 — not a real bank code. */
  ifsc: string;
  account_state: "ACTIVE" | "DORMANT" | "CLOSED";
  credits: Credit[];
}

export interface Credit {
  cycle: string;
  amount: number;
  credited_on: string;
  /** Last 4 of the account, for "credited to your account ending 4471" (§7.2 B6c). */
  account_last4: string;
}

export interface ItdRecord {
  /** §12.3 format: MOCKP0000M — structurally invalid. */
  pan_ref: string;
  is_taxpayer: boolean;
  assessment_year: string;
}

/** Maps each system code to the record type it returns. */
export interface RecordBySystem {
  mSCHEME: SchemeRecord;
  mUIDAI: UidaiRecord;
  mPFMS: PfmsRecord;
  mNPCI: NpciRecord;
  mLAND: LandRecord;
  mBANK: BankRecord;
  mITD: ItdRecord;
}

/* ── Results ─────────────────────────────────────────────────────────────── */

/** A reachable system that either held a record or did not.
 *  Distinguishing this from Unreachable is the whole point: §16.8 forbids
 *  guessing past a gap, and "no record" is knowledge while "no answer" is not. */
export interface SystemOk<S extends SystemCode> {
  system: S;
  ok: true;
  record: RecordBySystem[S] | null;
  observedAt: string;
  /** True when a staleBy fault made this an older view of the record. */
  stale?: boolean;
}

export interface SystemUnreachable<S extends SystemCode> {
  system: S;
  ok: false;
  error: "TIMEOUT" | "HTTP_ERROR" | "NOT_CONFIGURED";
  status?: number;
  observedAt: string;
}

export type SystemResult<S extends SystemCode> = SystemOk<S> | SystemUnreachable<S>;

/** Everything the engine is allowed to look at. §8.5: diagnose(snapshot, opts). */
export interface SystemSnapshot {
  beneficiaryRef: string;
  mSCHEME: SystemResult<"mSCHEME">;
  mUIDAI: SystemResult<"mUIDAI">;
  mPFMS: SystemResult<"mPFMS">;
  mNPCI: SystemResult<"mNPCI">;
  mLAND: SystemResult<"mLAND">;
  mBANK: SystemResult<"mBANK">;
  mITD: SystemResult<"mITD">;
}

export function unreachableSystems(snapshot: SystemSnapshot): SystemCode[] {
  return SYSTEM_CODES.filter((c) => !snapshot[c].ok);
}
