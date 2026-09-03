/* The grievance draft. CLAUDE.md §3.7, §11.7 S8.
 *
 * §3.7 is the claim this file exists to make true:
 *
 *   A grievance naming the instalment, the release date, the exact portal
 *   status string, the e-KYC state and the registration number resolves faster,
 *   because the officer does not have to write back and ask. Farmers cannot
 *   write that, because they cannot read the status page. NISHAN holds every
 *   one of those facts the moment diagnosis completes, so it produces the
 *   strong version for free.
 *
 * "For free" is meant literally, and it is why this composer authors NO NEW
 * PROSE about any blocker. The body is assembled from strings that already
 * shipped and are already tested:
 *
 *   the exact ask             fixPath.requestKey          (the Visit Slip)
 *   the facts                 Diagnosis.facts             (the engine)
 *   the portal status         Diagnosis.portalStatus      (the engine)
 *   the verdict sentence      verdict.<reason>.sentence   (the diagnosis screen)
 *                                                         - chip row only, see
 *                                                           the note in draftBody
 *
 * The consequence worth noticing: a new blocker with a Fix Path gets a correct,
 * fact-complete complaint with no extra copy written for it. If this file had
 * its own per-blocker paragraphs they could drift out of step with the verdict
 * the reader was just shown, and a complaint that contradicts the diagnosis
 * screen is worse than no complaint.
 *
 * Deterministic: same case, same locale, same draft. No clock read, no random
 * reference. The reader can edit the result, and what they send is whatever the
 * textarea holds - this only decides what it holds to begin with.
 */

import { resolve } from "./resolve";
import { fixPathFor } from "./fixPaths";
import type { CatalogueKey, Locale, Slots } from "../lib/content";
import type { Diagnosis } from "../lib/types/diagnosis";

/** One row of the "facts included" chip row (§11.7 S8). */
export interface FactChip {
  labelKey: CatalogueKey;
  /** Already-resolved display value, or null when the case has no such fact. */
  value: string | null;
}

/**
 * The chips, in the order §11.7 S8 lists them.
 *
 * Only facts the case actually holds appear. A chip reading "-" would claim a
 * fact is included when it is not, which is the opposite of the point.
 */
export function factChips(diagnosis: Diagnosis, stepsDone: number, totalSteps: number, locale: Locale = "en"): FactChip[] {
  const f = diagnosis.facts;
  const chips: FactChip[] = [
    { labelKey: "complaint.chip.instalment", value: f.cycle ?? null },
    { labelKey: "complaint.chip.released", value: f.released_on ?? null },
    { labelKey: "complaint.chip.portal", value: diagnosis.portalStatus },
    { labelKey: "complaint.chip.reason", value: resolve(("verdict." + diagnosis.reason + ".sentence") as CatalogueKey, f, locale) },
    { labelKey: "complaint.chip.record", value: f.khata_id ?? null },
    { labelKey: "complaint.chip.reg_no", value: f.reg_no ?? null },
    {
      labelKey: "complaint.chip.steps",
      value: stepsDone > 0
        ? resolve("complaint.steps_count", { done: stepsDone, total: totalSteps }, locale)
        : resolve("complaint.chip.none", {}, locale)
    }
  ];
  return chips.filter((c) => c.value !== null && c.value !== "");
}

/**
 * The draft body.
 *
 * Paragraphs are joined with a blank line so the result reads as a letter in a
 * textarea, which is what the reader is about to edit and send.
 */
export function draftBody(diagnosis: Diagnosis, stepsDone: number, totalSteps: number, locale: Locale = "en"): string {
  const facts: Slots = { ...diagnosis.facts };
  const path = fixPathFor(diagnosis.reason);

  const paragraphs: string[] = [
    resolve("complaint.draft_open", facts, locale)
  ];

  if (diagnosis.portalStatus) {
    paragraphs.push(resolve("complaint.draft_status", { portal_status: diagnosis.portalStatus }, locale));
  }

  /* NO separate paragraph naming the cause, and that is deliberate.
     The verdict sentence is written to the reader - "YOUR land record is in a
     different name from YOUR Aadhaar" - which is wrong in a letter the reader
     is signing. The alternative was a first-person variant per blocker, but
     that is exactly the per-blocker prose this file avoids, and it could drift
     out of step with the verdict on the diagnosis screen.
     It is not needed: each fix.request string already names the cause and the
     ask in one sentence addressed to an officer. The cause still reaches the
     reader, as the "what is stopping it" chip above the draft. */
  // The exact ask, in the same words the Visit Slip prints for the officer.
  if (path) {
    paragraphs.push(resolve("complaint.draft_request_intro", {}, locale));
    paragraphs.push(resolve(path.requestKey, facts, locale));
  }

  if (stepsDone > 0) {
    paragraphs.push(resolve("complaint.draft_steps", { done: stepsDone, total: totalSteps }, locale));
  }

  paragraphs.push(resolve("complaint.draft_close", facts, locale));

  return paragraphs.join("\n\n");
}

/** §3.6 appeal text, offered from day 30. Same discipline: facts only. */
export function cpgramsText(
  diagnosis: Diagnosis,
  reference: string,
  filedAt: string,
  daysOpen: number,
  locale: Locale = "en"
): string {
  return resolve("cpgrams.text", {
    ...diagnosis.facts,
    reference,
    filed_on: filedAt.slice(0, 10),
    days: daysOpen
  }, locale);
}
