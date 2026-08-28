import { renderVerdict } from "../content/verdict";
import { resolve } from "../content/resolve";
import { ReadAloudButton } from "./ReadAloudButton";
import type { Locale } from "../lib/content";
import type { Diagnosis } from "../lib/types/diagnosis";

/**
 * The one-sentence answer. §11.7 S4: it is the largest text on the page and it
 * sits ABOVE the rail - the rail is evidence for a claim already made, not a
 * puzzle the farmer has to solve.
 *
 * Exactly one `--stamp` element per screen (§11.3), and it belongs to the
 * blocked gate on the rail. So this card is never red, even when the news is
 * bad: two red things means the screen has failed. An overdue payment carries
 * `--pending`, which is its own job and not the stop marker.
 */
export function Verdict({ diagnosis, locale }: { diagnosis: Diagnosis; locale: Locale }) {
  const v = renderVerdict(diagnosis, locale);
  const indeterminate = diagnosis.confidence === "indeterminate";

  const tone = indeterminate || v.overdue
    ? "border-pending bg-paper"
    : diagnosis.primaryBlocker === "B6c"
      ? "border-green bg-green-soft"
      : "border-rule bg-paper";

  const spokenText = v.sentence + ". " + v.why;

  return (
    <section className={`rounded-card border-2 p-5 ${tone}`} aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-answer font-semibold text-ink flex-1 min-w-[240px]">{v.sentence}</h1>
        <ReadAloudButton text={spokenText} className="shrink-0" />
      </div>
      <p className="mt-4 text-body text-ink">{v.why}</p>
      {indeterminate && (
        <p className="mt-4 text-label font-semibold text-ink-soft">
          {resolve("verdict.indeterminate_footnote", {}, locale)}
        </p>
      )}
    </section>
  );
}
