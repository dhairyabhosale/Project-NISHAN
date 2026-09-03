"use client";

/* Route error boundary. AUDIT.md F9.
 *
 * Without this, an unhandled error anywhere in the app drops the reader onto
 * Next.js's built-in error page: black on white, English only, and off brand.
 * A reviewer who sees it reads the whole product as broken.
 *
 * Copy follows §10.5. It says what happened and what to do, it does not
 * apologise, and it is not vague. In particular it says that nothing was lost
 * and no record changed, because the reader's first fear on a government-facing
 * service is that their case has been damaged. */

import Link from "next/link";
import { useLocale } from "../components/LocaleProvider";
import { resolve } from "../content/resolve";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLocale();

  return (
    <main className="page-in shell pb-16 pt-10">
      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("error.title", {}, locale)}</h1>
      <p className="mt-4 prose-measure text-body text-ink">{resolve("error.body", {}, locale)}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
        >
          {resolve("error.retry", {}, locale)}
        </button>
        <Link
          href="/who"
          className="inline-flex min-h-14 items-center rounded-card border-2 border-teal-deep px-6 text-body font-semibold text-teal-deep"
        >
          {resolve("error.home", {}, locale)}
        </Link>
      </div>
    </main>
  );
}
