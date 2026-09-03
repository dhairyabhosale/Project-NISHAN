/* S2 - Identify. Server component so the persona fixtures stay off the client
   bundle: 11.9 caps the primary path at 150KB of JS. */

import { Suspense } from "react";
import { PERSONAS, CURRENT_CYCLE } from "../../mocks/fixtures";
import { referenceFor } from "../../lib/store";
import { IdentifyForm } from "./IdentifyForm";

export const dynamic = "force-dynamic";

export default function IdentifyPage() {
  const personas = PERSONAS.map((p) => ({
    reference: referenceFor(p.ref, CURRENT_CYCLE),
    label: p.label,
    personaRef: p.ref
  }));

  return (
    <Suspense fallback={null}>
      <IdentifyForm personas={personas} />
    </Suspense>
  );
}
