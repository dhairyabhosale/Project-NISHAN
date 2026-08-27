/* S11 — Demo controls. CLAUDE.md §11.7.
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
  const personas = PERSONAS.map((p) => ({
    ref: p.ref,
    label: p.label,
    demonstrates: p.demonstrates,
    blocker: p.expects.blocker,
    reason: p.expects.reason,
    reference: referenceFor(p.ref, CURRENT_CYCLE)
  }));
  return <PersonaPicker personas={personas} />;
}
