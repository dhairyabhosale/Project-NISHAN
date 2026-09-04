"use client";

/* One tap back to your case.
 *
 * The return path a login would give, without the login. §12.4 makes the case
 * reference the credential; this remembers the last one this device opened so a
 * returning reader does not identify from scratch.
 *
 * It renders nothing at all when there is nothing to resume, which is most
 * first visits. An empty "no recent case" box would be furniture on the one
 * screen §11.7 gives three seconds to be understood.
 *
 * "Not mine, forget it" is not politeness. §5.2 says the modal user is a helper
 * on their own phone, and a helper who checked for a neighbour must be able to
 * clear that without hunting through browser settings.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";
import { readRecent, forgetRecent } from "../lib/recentCase";

export function ResumeCase() {
  const { locale } = useLocale();
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => { setReference(readRecent()); }, []);

  if (!reference) return null;

  return (
    <section className="rounded-card border-2 border-teal-deep bg-paper p-5">
      <h2 className="text-head font-semibold text-ink">{resolve("resume.heading", {}, locale)}</h2>
      <p className="mt-2 prose-measure text-body text-ink">
        {resolve("resume.body", { reference }, locale)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={"/case/" + encodeURIComponent(reference)}
          className="inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
        >
          {resolve("resume.cta", {}, locale)}
        </Link>
        <button
          type="button"
          onClick={() => { forgetRecent(); setReference(null); }}
          className="inline-flex min-h-12 items-center rounded-card border border-rule px-4 text-label font-semibold text-ink"
        >
          {resolve("resume.forget", {}, locale)}
        </button>
      </div>
    </section>
  );
}
