/* Completable actions - the answer to P10.
 *
 * P10 is the failure this file exists to close: "the portal cannot complete its
 * own core task without ejecting the user to another app or a physical office.
 * Every ejection is a drop-off point." Diagnosis without completion is the same
 * failure with better copy - we named the cause, then sent the reader to a bus.
 *
 * Four actions finish here instead. Each one is simulated against the mock
 * systems, disclosed in place, and appends to the case log so the timeline
 * records it.
 *
 * THE RULE THAT MATTERS MOST is the third field below. An action that cannot
 * work for this person is shown RULED OUT WITH THE REASON, never hidden and
 * never offered. §10.4 already does this for OTP, and that line - "a code will
 * not reach you, because no phone number is linked to your Aadhaar" - is the
 * single most useful sentence in the product. Hiding an impossible route makes
 * the reader wonder; offering one wastes their day.
 *
 * WHERE AN OFFICE VISIT IS GENUINELY THE ONLY ROUTE we keep the Visit Slip and
 * say so. A land record naming a different person, a rejected registration, a
 * contested exclusion - none of those can be completed by anyone sitting at a
 * phone, and faking completion would be the worst thing in the build.
 *
 * The availability rules reuse `compareNames` from the diagnosis engine rather
 * than inventing a second definition of "is this the same person". That rule is
 * already tested and already decides whether a case flags at all; a screen that
 * disagreed with it would be telling the reader something the engine denies.
 */

import { compareNames } from "../engine/names";
import type { CatalogueKey } from "./content";
import type { Diagnosis, ReasonCode } from "./types/diagnosis";

export type ActionId = "EKYC_FACE" | "UPDATE_MOBILE" | "CONFIRM_NAME" | "RESEED_AADHAAR";

export const ACTION_IDS: readonly ActionId[] = ["EKYC_FACE", "UPDATE_MOBILE", "CONFIRM_NAME", "RESEED_AADHAAR"];

export interface Availability {
  available: boolean;
  /** Required when unavailable. Shown, never swallowed. */
  becauseKey?: CatalogueKey;
}

export interface ActionSpec {
  id: ActionId;
  titleKey: CatalogueKey;
  bodyKey: CatalogueKey;
  ctaKey: CatalogueKey;
  /** §12.7 - in place, at the moment of highest risk of being believed. */
  disclosureKey: CatalogueKey;
  doneKey: CatalogueKey;
  /** Working days before the change takes effect, for the expected-by date. */
  effectDays: number;
  /** Blockers this action can actually clear. */
  clears: readonly ReasonCode[];
  availability(diagnosis: Diagnosis): Availability;
}

function isActionId(v: string): v is ActionId {
  return (ACTION_IDS as readonly string[]).includes(v);
}

export const ACTIONS: Record<ActionId, ActionSpec> = {
  /* P7 and P10 together. The portal makes e-KYC mandatory, offers a mobile OTP
     as the way to do it, and when that number is dead offers an app download or
     a Common Service Centre. A face check needs no phone number, so it works
     for exactly the person the OTP route abandons. */
  EKYC_FACE: {
    id: "EKYC_FACE",
    titleKey: "act.ekyc.title",
    bodyKey: "act.ekyc.body",
    ctaKey: "act.ekyc.cta",
    disclosureKey: "act.ekyc.disclosure",
    doneKey: "act.ekyc.done",
    effectDays: 7,
    clears: ["MOBILE_NOT_LINKED", "EKYC_PENDING_ACTION", "NAME_VARIANCE", "DOB_MISMATCH", "GENDER_MISMATCH"],
    availability(d) {
      if (!this.clears.includes(d.reason)) {
        return { available: false, becauseKey: "act.ruled_out.not_this_blocker" };
      }
      return { available: true };
    }
  },

  /* The root cause behind the whole B3 case, and the one change that makes the
     ordinary OTP route work for this person ever again. Worth doing even after
     a face check has cleared the immediate block. */
  UPDATE_MOBILE: {
    id: "UPDATE_MOBILE",
    titleKey: "act.mobile.title",
    bodyKey: "act.mobile.body",
    ctaKey: "act.mobile.cta",
    disclosureKey: "act.mobile.disclosure",
    doneKey: "act.mobile.done",
    effectDays: 3,
    clears: ["MOBILE_NOT_LINKED", "EKYC_PENDING_ACTION"],
    availability(d) {
      if (!this.clears.includes(d.reason)) {
        return { available: false, becauseKey: "act.ruled_out.not_this_blocker" };
      }
      return { available: true };
    }
  },

  /* A spelling variance is one person written two ways, and confirming which
     spelling is right is something the reader can do. A DIFFERENT PERSON on the
     land record is not, and the engine already knows the difference. */
  CONFIRM_NAME: {
    id: "CONFIRM_NAME",
    titleKey: "act.name.title",
    bodyKey: "act.name.body",
    ctaKey: "act.name.cta",
    disclosureKey: "act.name.disclosure",
    doneKey: "act.name.done",
    effectDays: 10,
    clears: ["NAME_VARIANCE", "LAND_NAME_MISMATCH"],
    availability(d) {
      if (!this.clears.includes(d.reason)) {
        return { available: false, becauseKey: "act.ruled_out.not_this_blocker" };
      }
      const a = d.facts.aadhaar_name;
      const b = d.facts.land_owner_name ?? d.facts.on_record;
      if (!a || !b) return { available: false, becauseKey: "act.ruled_out.no_names" };

      /* The distinction the whole action turns on. compareNames is the engine's
         own rule, so this cannot disagree with the verdict the reader was just
         shown. Two spellings of one name: the reader can settle it. Two
         different people: only the revenue office can, and saying so is more
         use than a form that would achieve nothing. */
      if (compareNames(a, b).match) return { available: true };
      return { available: false, becauseKey: "act.ruled_out.different_person" };
    }
  },

  /* B4 without the bank trip. The money is approved and has nowhere to land,
     which is the most fixable blocker in the taxonomy and the one that most
     obviously should not require a morning off work. */
  RESEED_AADHAAR: {
    id: "RESEED_AADHAAR",
    titleKey: "act.reseed.title",
    bodyKey: "act.reseed.body",
    ctaKey: "act.reseed.cta",
    disclosureKey: "act.reseed.disclosure",
    doneKey: "act.reseed.done",
    effectDays: 7,
    clears: ["MAPPER_INACTIVE", "MAPPER_NOT_FOUND", "MAPPER_DIFFERENT_BANK"],
    availability(d) {
      if (!this.clears.includes(d.reason)) {
        return { available: false, becauseKey: "act.ruled_out.not_this_blocker" };
      }
      if (!d.facts.account_ref) return { available: false, becauseKey: "act.ruled_out.no_account" };
      return { available: true };
    }
  }
};

export function actionFor(id: string): ActionSpec | null {
  return isActionId(id) ? ACTIONS[id] : null;
}

/** Every action that can be completed here for this case, in offer order. */
export function availableActions(diagnosis: Diagnosis): ActionSpec[] {
  return ACTION_IDS.map((id) => ACTIONS[id]).filter((a) => a.availability(diagnosis).available);
}

/**
 * Actions worth SHOWING as ruled out.
 *
 * Only the ones this blocker is about. Listing every action the case does not
 * need would bury the one useful sentence under six irrelevant ones - the
 * six-flag status grid §11.10 already cut, wearing different clothes.
 */
export function ruledOutActions(diagnosis: Diagnosis): { spec: ActionSpec; becauseKey: CatalogueKey }[] {
  return ACTION_IDS
    .map((id) => ACTIONS[id])
    .filter((a) => a.clears.includes(diagnosis.reason))
    .map((spec) => ({ spec, availability: spec.availability(diagnosis) }))
    .filter((x) => !x.availability.available && x.availability.becauseKey)
    .map((x) => ({ spec: x.spec, becauseKey: x.availability.becauseKey as CatalogueKey }));
}

/**
 * Reasons where there is nothing for anyone to do - not here, and not at an
 * office either.
 *
 * A payment in flight is not broken and a credited payment is not missing, so
 * telling either reader "an office has to do this" would be false and would
 * send someone to a counter to fix nothing. §7.2 is explicit that "not broken,
 * just waiting" is an answer.
 */
const NOTHING_TO_DO: readonly ReasonCode[] = [
  "FTO_IN_QUEUE", "RFT_SIGNED", "SETTLEMENT_PENDING", "NOT_YET_QUEUED", "CREDITED", "NONE",
  // §16.8: with a system silent we do not know what would help, so we must not
  // claim an office is the answer.
  "SYSTEM_UNREACHABLE"
];

export function nothingToDo(diagnosis: Diagnosis): boolean {
  return NOTHING_TO_DO.includes(diagnosis.reason);
}

/** True when the case IS blocked, nothing can be finished here, and the Visit
 *  Slip is the honest answer. §10.4: an office visit costs a day's wage, so it
 *  is never the default - only what is left when everything else is closed. */
export function officeOnly(diagnosis: Diagnosis): boolean {
  return !nothingToDo(diagnosis) && availableActions(diagnosis).length === 0;
}
