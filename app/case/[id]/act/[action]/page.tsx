/* Completable actions - the answer to P10. */

import { notFound } from "next/navigation";
import { getCase } from "../../../../../lib/store";
import { actionFor } from "../../../../../lib/actions";
import { CaseNotFound } from "../../CaseNotFound";
import { ActView } from "./ActView";

export const dynamic = "force-dynamic";

export default async function ActPage({ params }: { params: { id: string; action: string } }) {
  const spec = actionFor(params.action.toUpperCase());
  if (!spec) notFound();

  const record = await getCase(decodeURIComponent(params.id), new Date().toISOString());
  if (!record) return <CaseNotFound />;

  const availability = spec.availability(record.diagnosis);

  return (
    <ActView
      reference={record.reference}
      diagnosis={record.diagnosis}
      actionId={spec.id}
      available={availability.available}
      becauseKey={availability.becauseKey ?? null}
      effectDays={spec.effectDays}
    />
  );
}
