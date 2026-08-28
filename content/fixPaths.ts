/* E7 - Fix Paths. CLAUDE.md §10.4.
 *
 * A Fix Path knows three things the portal never tells anyone:
 *
 *   1. WHO can actually fix this. The central helpline cannot fix land seeding.
 *      Sending someone to the wrong counter costs a day's wage and a bus fare -
 *      that is the real price of a vague answer.
 *   2. WHICH ROUTE will work FOR THIS PERSON. Routes carry `available` and
 *      `unavailableBecause`. An impossible route is shown RULED OUT WITH THE
 *      REASON, never hidden - "the code will not reach you because no phone
 *      number is linked to your Aadhaar" is the single most useful sentence in
 *      the product, and the portal's default advice is exactly the route that
 *      cannot work.
 *   3. WHETHER AN OFFICER IS REQUIRED, which decides whether this is a
 *      checklist or a visit.
 *
 * Three are authored in full (§15 cut the rest). Every other ReasonCode falls
 * back to a generic authority card built from the authority label alone -
 * accurate and thin, rather than absent or invented.
 *
 * Authorities are ROLES, never named individuals (§10.4). */

import type { ReasonCode } from "../lib/types/diagnosis";
import type { CatalogueKey } from "../lib/content";

export type Authority =
  | "SELF_ONLINE" | "CSC" | "BANK_BRANCH" | "VILLAGE_REVENUE_OFFICER"
  | "BLOCK_AGRICULTURE_OFFICER" | "DISTRICT_AGRICULTURE_OFFICER" | "STATE_NODAL_OFFICER";

export interface FixRoute {
  id: string;
  labelKey: CatalogueKey;
  /** False when this route cannot work for this person. */
  available: boolean;
  /** Required when `available` is false. Shown, not hidden. */
  unavailableBecauseKey?: CatalogueKey;
  /** Working days before the fix takes effect. */
  effectDays: number;
  authority: Authority;
  stepKeys: CatalogueKey[];
  carryKeys: CatalogueKey[];
  /** True where the step can be completed on this screen. */
  selfServe?: boolean;
}

export interface FixPath {
  reason: ReasonCode;
  authority: Authority;
  needsOfficer: boolean;
  /** The exact ask, for the Visit Slip (§11.7 S7). */
  requestKey: CatalogueKey;
  routes: FixRoute[];
}

export const AUTHORITY_KEY: Record<Authority, CatalogueKey> = {
  SELF_ONLINE: "authority.self_online",
  CSC: "authority.csc",
  BANK_BRANCH: "authority.bank_branch",
  VILLAGE_REVENUE_OFFICER: "authority.village_revenue_officer",
  BLOCK_AGRICULTURE_OFFICER: "authority.block_agriculture_officer",
  DISTRICT_AGRICULTURE_OFFICER: "authority.district_agriculture_officer",
  STATE_NODAL_OFFICER: "authority.state_nodal_officer"
};

const FIX_PATHS: Partial<Record<ReasonCode, FixPath>> = {
  /* Lakshmi. The demo path, and the P7 insight: the route the portal offers by
     default is precisely the one that cannot work for her. */
  MOBILE_NOT_LINKED: {
    reason: "MOBILE_NOT_LINKED",
    authority: "CSC",
    needsOfficer: false,
    requestKey: "fix.request.MOBILE_NOT_LINKED",
    routes: [
      {
        id: "csc",
        labelKey: "fix.route.csc_ekyc",
        available: true,
        effectDays: 10,
        authority: "CSC",
        selfServe: false,
        stepKeys: ["fix.step.csc_ekyc.1", "fix.step.csc_ekyc.2", "fix.step.csc_ekyc.3"],
        carryKeys: ["carry.aadhaar", "carry.reg_no", "carry.passbook"]
      },
      {
        id: "otp",
        labelKey: "fix.route.otp_ekyc",
        available: false,
        unavailableBecauseKey: "fix.ruled_out.otp_no_mobile",
        effectDays: 7,
        authority: "SELF_ONLINE",
        selfServe: true,
        stepKeys: [],
        carryKeys: []
      },
      {
        id: "link_mobile",
        labelKey: "fix.route.link_mobile",
        available: true,
        effectDays: 14,
        authority: "CSC",
        stepKeys: ["fix.step.link_mobile.1", "fix.step.link_mobile.2"],
        carryKeys: ["carry.aadhaar", "carry.phone"]
      }
    ]
  },

  /* Ramesh. "The money has nowhere to land" - only his bank can fix it. */
  MAPPER_INACTIVE: {
    reason: "MAPPER_INACTIVE",
    authority: "BANK_BRANCH",
    needsOfficer: false,
    requestKey: "fix.request.MAPPER_INACTIVE",
    routes: [
      {
        id: "branch",
        labelKey: "fix.route.bank_link",
        available: true,
        effectDays: 10,
        authority: "BANK_BRANCH",
        stepKeys: ["fix.step.bank_link.1", "fix.step.bank_link.2", "fix.step.bank_link.3"],
        carryKeys: ["carry.aadhaar", "carry.passbook"]
      },
      {
        id: "online",
        labelKey: "fix.route.bank_online",
        available: false,
        unavailableBecauseKey: "fix.ruled_out.bank_online",
        effectDays: 10,
        authority: "SELF_ONLINE",
        stepKeys: [],
        carryKeys: []
      }
    ]
  },

  /* Sarala. Needs an officer, which is what earns a Visit Slip. */
  LAND_NAME_MISMATCH: {
    reason: "LAND_NAME_MISMATCH",
    authority: "VILLAGE_REVENUE_OFFICER",
    needsOfficer: true,
    requestKey: "fix.request.LAND_NAME_MISMATCH",
    routes: [
      {
        id: "vro",
        labelKey: "fix.route.land_correction",
        available: true,
        effectDays: 30,
        authority: "VILLAGE_REVENUE_OFFICER",
        stepKeys: ["fix.step.land_correction.1", "fix.step.land_correction.2", "fix.step.land_correction.3"],
        carryKeys: ["carry.aadhaar", "carry.land_document", "carry.reg_no", "carry.slip"]
      },
      {
        id: "online",
        labelKey: "fix.route.land_online",
        available: false,
        unavailableBecauseKey: "fix.ruled_out.land_online",
        effectDays: 30,
        authority: "SELF_ONLINE",
        stepKeys: [],
        carryKeys: []
      }
    ]
  }
};

/** Where a blocker sends someone when no full Fix Path is authored. */
const FALLBACK_AUTHORITY: Partial<Record<ReasonCode, Authority>> = {
  REGISTRATION_REJECTED: "CSC",
  REGISTRATION_PENDING: "CSC",
  INCOME_TAX_PAYER: "BLOCK_AGRICULTURE_OFFICER",
  GOVT_EMPLOYEE: "BLOCK_AGRICULTURE_OFFICER",
  PENSIONER: "BLOCK_AGRICULTURE_OFFICER",
  LAND_ACQUIRED_AFTER_CUTOFF: "VILLAGE_REVENUE_OFFICER",
  FAMILY_DUPLICATE: "BLOCK_AGRICULTURE_OFFICER",
  DOB_MISMATCH: "CSC",
  GENDER_MISMATCH: "CSC",
  NAME_VARIANCE: "CSC",
  EKYC_PENDING_ACTION: "CSC",
  MAPPER_NOT_FOUND: "BANK_BRANCH",
  MAPPER_DIFFERENT_BANK: "BANK_BRANCH",
  LAND_NOT_SEEDED: "VILLAGE_REVENUE_OFFICER",
  STATE_HOLD: "BLOCK_AGRICULTURE_OFFICER",
  BANK_RETURNED: "BANK_BRANCH",
  ACCOUNT_DORMANT: "BANK_BRANCH",
  ACCOUNT_CLOSED: "BANK_BRANCH",
  FTO_IN_QUEUE: "BLOCK_AGRICULTURE_OFFICER",
  RFT_SIGNED: "BLOCK_AGRICULTURE_OFFICER",
  SETTLEMENT_PENDING: "BANK_BRANCH",
  NOT_YET_QUEUED: "BLOCK_AGRICULTURE_OFFICER",
  CREDITED: "BANK_BRANCH",
  SYSTEM_UNREACHABLE: "BLOCK_AGRICULTURE_OFFICER"
};

export function fixPathFor(reason: ReasonCode): FixPath | null {
  return FIX_PATHS[reason] ?? null;
}

export function authorityFor(reason: ReasonCode): Authority {
  return FIX_PATHS[reason]?.authority ?? FALLBACK_AUTHORITY[reason] ?? "BLOCK_AGRICULTURE_OFFICER";
}

export function needsOfficer(reason: ReasonCode): boolean {
  const path = FIX_PATHS[reason];
  if (path) return path.needsOfficer;
  const a = authorityFor(reason);
  return a !== "SELF_ONLINE" && a !== "CSC" && a !== "BANK_BRANCH";
}
