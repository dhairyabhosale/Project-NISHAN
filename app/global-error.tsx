"use client";

/* Last-resort boundary. AUDIT.md F9.
 *
 * This one catches a failure in the root layout itself, so it REPLACES that
 * layout and has to render its own <html> and <body>. Two consequences:
 *
 *   1. LocaleProvider is part of the layout that just failed, so there is no
 *      locale context to read. Copy resolves at the default locale explicitly.
 *      It still comes from the catalogue, so §16.4 holds even here.
 *   2. The layout's stylesheet import went with it, so globals.css is imported
 *      again. The font variables are declared on the old <html> and are gone;
 *      the page falls back to a system face, which is the right trade for a
 *      page that only renders when everything else has failed.
 */

import "./globals.css";
import { resolve } from "../content/resolve";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="shell pb-16 pt-10">
          <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("error.title", {}, "en")}</h1>
          <p className="mt-4 prose-measure text-body text-ink">{resolve("error.body", {}, "en")}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
            >
              {resolve("error.retry", {}, "en")}
            </button>
            <a
              href="/who"
              className="inline-flex min-h-14 items-center rounded-card border-2 border-teal-deep px-6 text-body font-semibold text-teal-deep"
            >
              {resolve("error.home", {}, "en")}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
