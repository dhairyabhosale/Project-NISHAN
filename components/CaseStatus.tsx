"use client";

/* The persistent case view. What a dashboard is for, without the login.
 *
 * A reader who comes back a week later needs four things and the portal gives
 * none of them: where this stands now, what has already been done, what is
 * being waited on, and what they should do next. This panel is those four,
 * assembled from state that already exists - the diagnosis, the actions
 * completed on this device, and the filing date - and nothing new is invented
 * to fill it.
 *
 * It also writes the reference to the device, which is what makes the return
 * path work (lib/recentCase). That write is the only side effect here, and it
 * is the whole "log in" story: a reference remembered, not an account created.
 */

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";
import { ACTIONS, availableActions, officeOnly, nothingToDo } from "../lib/actions";
import { readActions, type CompletedAction } from "../lib/actionStore";
import { readFiledAt } from "../lib/grievanceStore";
import { writeRecent } from "../lib/recentCase";
import { clockFor, addDays } from "../lib/escalation";
import { needsOfficer } from "../content/fixPaths";
import type { CatalogueKey } from "../lib/content";
import type { Diagnosis } from "../lib/types/diagnosis";

export function CaseStatus({ reference, diagnosis }: { reference: string; diagnosis: Diagnosis }) {
  const { locale } = useLocale();
  const [done, setDone] = useState<CompletedAction[]>([]);
  const [filedAt, setFiledAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDone(readActions(reference));
    setFiledAt(readFiledAt(reference));
    writeRecent(reference);
    setLoaded(true);
  }, [reference]);

  /* NO early return while the device is being read.
     The first version bailed out until `loaded` was true, which meant the panel
     existed only after JavaScript ran - exactly the F6 failure, on the screen
     §11.7 calls 60% of the demo. The route smoke suite caught it.
     So the panel renders from what the SERVER knows (the diagnosis, and
     therefore the state and the next step), and the device detail - actions
     completed, a filing - fills in a moment later. A reader on a slow phone
     gets the answer immediately and the history shortly after, rather than a
     blank space and then everything. */

  const now = new Date().toISOString();
  const clock = filedAt ? clockFor(filedAt, now) : null;
  const credited = diagnosis.primaryBlocker === "B6c";
  const waiting = diagnosis.primaryBlocker === "B6a";

  const stateKey: CatalogueKey =
    credited ? "status.state.credited"
      : clock ? "status.state.complained"
        : done.length > 0 ? "status.state.acting"
          : waiting ? "status.state.waiting"
            : "status.state.diagnosed";

  /* What is being waited on. At most one thing: a reader waiting on two clocks
     is a reader who cannot tell you when anything happens. */
  const pending: string | null =
    credited ? null
      : clock ? resolve("status.pending.clock", { date: clock.dueAt.slice(0, 10) }, locale)
        : done.length > 0
          ? resolve("status.pending.effect", {
              date: addDays(done[done.length - 1].at, ACTIONS[done[done.length - 1].id].effectDays).slice(0, 10)
            }, locale)
          : waiting ? resolve("status.pending.cycle", {}, locale) : null;

  const nextKey: CatalogueKey =
    credited || nothingToDo(diagnosis) ? "status.next.none"
      : clock ? "status.next.wait"
        : availableActions(diagnosis).length > 0 ? "status.next.act"
          : needsOfficer(diagnosis.reason) ? "status.next.complain"
            : officeOnly(diagnosis) ? "status.next.slip"
              : "status.next.act";

  return (
    <section className="mt-6 rounded-card border-2 border-teal-deep bg-paper p-5">
      <h2 className="text-label font-bold uppercase tracking-wide text-ink-soft">
        {resolve("status.heading", {}, locale)}
      </h2>

      <dl className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-label font-semibold text-ink-soft">{resolve("status.now", {}, locale)}</dt>
          <dd className="mt-1 prose-measure text-body text-ink">{resolve(stateKey, {}, locale)}</dd>
        </div>

        <div>
          <dt className="text-label font-semibold text-ink-soft">{resolve("status.next", {}, locale)}</dt>
          <dd className="mt-1 prose-measure text-body font-semibold text-ink">{resolve(nextKey, {}, locale)}</dd>
        </div>

        <div>
          <dt className="text-label font-semibold text-ink-soft">{resolve("status.done", {}, locale)}</dt>
          <dd className="mt-1 text-body text-ink">
            {loaded && done.length === 0 && !filedAt
              ? resolve("status.nothing_done", {}, locale)
              : (
                <ul className="space-y-1">
                  {done.map((a) => (
                    <li key={a.id} className="flex gap-2">
                      <span aria-hidden="true" className="text-ink">✓</span>
                      <span>{resolve(ACTIONS[a.id].titleKey, {}, locale)}</span>
                    </li>
                  ))}
                  {filedAt && (
                    <li className="flex gap-2">
                      <span aria-hidden="true" className="text-ink">✓</span>
                      <span>{resolve("timeline.event.grievance_filed", {}, locale)}</span>
                    </li>
                  )}
                </ul>
              )}
          </dd>
        </div>

        {pending && (
          <div>
            <dt className="text-label font-semibold text-ink-soft">{resolve("status.pending", {}, locale)}</dt>
            <dd className="mt-1 prose-measure text-body text-ink">{pending}</dd>
          </div>
        )}
      </dl>

      {/* §12.4: the reference is the credential, and it works on any phone. */}
      <p className="mt-5 border-t border-rule pt-4 prose-measure text-label text-ink-soft">
        {resolve("status.reference_note", {}, locale)}
      </p>
    </section>
  );
}
