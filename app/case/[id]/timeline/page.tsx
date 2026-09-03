/* S9 - Timeline. CLAUDE.md §11.7 S9, §8.8.
 *
 * `advance` is the time-travel control (§8.9). It is a search parameter rather
 * than client state so the shifted view is a shareable link - the video can
 * open the ladder mid-climb without anyone clicking - and so the server renders
 * the same thing the reader sees.
 *
 * It shifts ONLY the instant the clock is asked about. It does not write
 * anything, does not change the filing date, and runs the same escalation code
 * a real 15-day wait would. That is the point: if it took a different path it
 * would be a mock-up of the feature rather than a view of it.
 */

import { getCase, listEvents } from "../../../../lib/store";
import { CaseNotFound } from "../CaseNotFound";
import { TimelineView } from "./TimelineView";

export const dynamic = "force-dynamic";

const MAX_ADVANCE_DAYS = 365;

function advanceDays(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_ADVANCE_DAYS, Math.max(0, Math.floor(n)));
}

export default async function TimelinePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { advance?: string };
}) {
  const advance = advanceDays(searchParams.advance);
  const now = new Date(Date.now() + advance * 86_400_000).toISOString();

  const record = await getCase(decodeURIComponent(params.id), now);
  if (!record) return <CaseNotFound />;

  return (
    <TimelineView
      reference={record.reference}
      state={record.state}
      diagnosis={record.diagnosis}
      serverEvents={listEvents(record.reference)}
      advance={advance}
      now={now}
    />
  );
}
