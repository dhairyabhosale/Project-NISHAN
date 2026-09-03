/* S11 - Demo controls. CLAUDE.md §11.7.
 *
 * Visibly a demo surface, not part of the citizen product. Eight personas, each
 * naming the blocker it demonstrates, so a reviewer can reach any branch of the
 * engine in one tap rather than hunting for an input that triggers it.
 *
 * NSH-405 (the fault switch UI) is cut per §15; the capability survives and is
 * documented here as a URL parameter. */

import { PERSONAS, CURRENT_CYCLE } from "../../mocks/fixtures";
import { referenceFor } from "../../lib/store";
import { PersonaPicker } from "./PersonaPicker";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  const categoryFor = (ref: string): "healthy" | "ekyc" | "bank" | "land" | "eligibility" => {
    if (ref === "P6") return "healthy";
    if (ref === "P1" || ref === "P5") return "ekyc";
    if (ref === "P2" || ref === "P4") return "bank";
    if (ref === "P3") return "land";
    return "eligibility";
  };

  const personas = PERSONAS.map((p) => ({
    ref: p.ref,
    label: p.label,
    reference: referenceFor(p.ref, CURRENT_CYCLE),
    aadhaar: p.mUIDAI?.aadhaar_ref ?? "",
    regNo: p.mSCHEME?.reg_no ?? "",
    portalStatus: p.mSCHEME?.status_string ?? "",
    category: categoryFor(p.ref)
  }));
  return <PersonaPicker personas={personas} />;
}
