/* S7 - Visit Slip. CLAUDE.md §11.7. */

import { getCase } from "../../../../../lib/store";
import { CaseNotFound } from "../../CaseNotFound";
import { SlipView } from "./SlipView";

export const dynamic = "force-dynamic";

export default async function SlipPage({ params }: { params: { id: string } }) {
  const record = await getCase(decodeURIComponent(params.id), new Date().toISOString());
  if (!record) return <CaseNotFound />;
  return <SlipView reference={record.reference} diagnosis={record.diagnosis} />;
}
