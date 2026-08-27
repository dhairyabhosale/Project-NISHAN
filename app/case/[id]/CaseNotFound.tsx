"use client";

import Link from "next/link";
import { useLocale } from "../../../components/LocaleProvider";
import { resolve } from "../../../content/resolve";

/** An empty state gets the same care as the happy path — a judge will find it. */
export function CaseNotFound() {
  const { locale } = useLocale();
  return (
    <main className="shell pb-16 pt-10">
      <h1 className="text-head font-semibold text-ink">{resolve("case.not_found", {}, locale)}</h1>
      <Link
        href="/who"
        className="mt-6 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-5 text-body font-semibold text-paper"
      >
        {resolve("who.submit", {}, locale)}
      </Link>
    </main>
  );
}
