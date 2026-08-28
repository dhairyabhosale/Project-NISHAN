/* S4 - Diagnosis. CLAUDE.md §11.7. This screen is 60% of the demo.
 *
 * A server component: the verdict is computed on the server from the real
 * engine, so the phone downloads an answer rather than the machinery to
 * compute one. §11.9 budgets 150KB of JS on the primary path.
 *
 * `?fault=` reaches the MGSL from here (§8.4). NSH-405, the fault switch UI, is
 * cut - the capability is triggered by URL in the video instead. */

import { getCase, openCustomCase } from "../../../lib/store";
import { decodeSpec, personaForSpec } from "../../../lib/demoCase";
import { parseFaultSpec } from "../../../mocks/fault";
import { CaseView } from "./CaseView";
import { CaseNotFound } from "./CaseNotFound";

export const dynamic = "force-dynamic";

export default async function CasePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { fault?: string; d?: string };
}) {
  const faults = parseFaultSpec(searchParams.fault ?? null);
  const now = new Date().toISOString();

  // A user-created case travels in its own link (lib/demoCase.ts) rather than
  // in server memory, so it opens on any instance and survives a restart.
  const spec = searchParams.d ? decodeSpec(searchParams.d) : null;
  const custom = spec ? personaForSpec(spec) : null;

  const record = custom
    ? await openCustomCase(custom, now, undefined, faults)
    : await getCase(decodeURIComponent(params.id), now, undefined, faults);

  if (!record) return <CaseNotFound />;

  return (
    <CaseView
      reference={record.reference}
      gates={record.gates}
      diagnosis={record.diagnosis}
    />
  );
}
