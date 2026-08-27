import Link from "next/link";
import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

/**
 * Case reference and amount, above the verdict.
 *
 * This deliberately carries NO heading element. §11.7 S4 makes the verdict
 * sentence the page heading and the largest text on the screen; a second
 * 30px title here would compete with it and break the "one idea per screen"
 * rule (§6.2). The reference is mono because it is a record, not prose (§11.4).
 */
export function CaseHeader({ id, amount, locale }: { id: string; amount: string; locale: Locale }) {
  return (
    <header>
      <Link
        href="/"
        className="inline-flex min-h-12 items-center text-label font-bold text-ink underline underline-offset-4"
      >
        {resolve("case.back", {}, locale)}
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="data text-ink-soft">{id}</p>
        <p className="text-head font-semibold text-teal-deep">{resolve("case.amount", { amount }, locale)}</p>
      </div>
    </header>
  );
}
