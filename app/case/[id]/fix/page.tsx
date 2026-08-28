/* S6 - Fix Path. CLAUDE.md §11.7. */

import { getCase } from "../../../../lib/store";
import { CaseNotFound } from "../CaseNotFound";
import { FixView } from "./FixView";

export const dynamic = "force-dynamic";

export default async function FixPage({ params }: { params: { id: string } }) {
  const record = await getCase(decodeURIComponent(params.id), new Date().toISOString());
  if (!record) return <CaseNotFound />;
  return <FixView reference={record.reference} diagnosis={record.diagnosis} />;
}
