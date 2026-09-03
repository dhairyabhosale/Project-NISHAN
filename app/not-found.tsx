"use client";

/* 404. AUDIT.md F9.
 *
 * A mistyped or stale link is the most likely way a reader arrives somewhere
 * that does not exist, so this page does not dwell on the error. It names what
 * happened in one line and puts the one useful action underneath it. */

import Link from "next/link";
import { useLocale } from "../components/LocaleProvider";
import { resolve } from "../content/resolve";

export default function NotFound() {
  const { locale } = useLocale();

  return (
    <main className="page-in shell pb-16 pt-10">
      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("notfound.title", {}, locale)}</h1>
      <p className="mt-4 prose-measure text-body text-ink">{resolve("notfound.body", {}, locale)}</p>

      <Link
        href="/who"
        className="mt-8 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
      >
        {resolve("notfound.action", {}, locale)}
      </Link>
    </main>
  );
}
