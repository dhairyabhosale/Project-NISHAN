/* S8 - Grievance. CLAUDE.md §11.7 S8, §3.7. */

import { getCase } from "../../../../lib/store";
import { CaseNotFound } from "../CaseNotFound";
import { ComplaintView } from "./ComplaintView";
import { draftBody } from "../../../../content/grievance";
import { fixPathFor } from "../../../../content/fixPaths";

export const dynamic = "force-dynamic";

export default async function ComplaintPage({ params }: { params: { id: string } }) {
  const record = await getCase(decodeURIComponent(params.id), new Date().toISOString());
  if (!record) return <CaseNotFound />;
  /* The draft is composed on the SERVER, so the first response carries the
     letter rather than an empty textarea. F6 was exactly this mistake on
     /who/verify: a primary-path screen whose content only existed once
     JavaScript had run. Steps completed are on the device, so the server
     assembles the no-steps version and the client refines it if there are any
     - and only while the reader has not started editing. */
  const totalSteps = fixPathFor(record.diagnosis.reason)?.routes.find((r) => r.available)?.stepKeys.length ?? 0;
  return (
    <ComplaintView
      reference={record.reference}
      diagnosis={record.diagnosis}
      initialDraft={draftBody(record.diagnosis, 0, totalSteps, "en")}
      totalSteps={totalSteps}
    />
  );
}
