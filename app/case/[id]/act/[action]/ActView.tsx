"use client";

/* One completable action. CLAUDE.md P7, P10, §12.7.
 *
 * The shell is shared across all four because the honesty furniture must be
 * identical every time: what this is, what is simulated, how long it takes to
 * take effect, and what happens if the money still does not arrive. An action
 * that quietly dropped its disclosure would be the one that misled someone.
 *
 * The camera component is imported dynamically so its code loads only on this
 * route with this action - §11.9 caps the primary path at 150KB, and a camera
 * has no business in the bundle of a reader who is looking at a bank blocker.
 */

import Link from "next/link";
import dynamicImport from "next/dynamic";
import { useEffect, useState } from "react";
import { useLocale } from "../../../../../components/LocaleProvider";
import { resolve } from "../../../../../content/resolve";
import { ACTIONS, type ActionId } from "../../../../../lib/actions";
import { readActions, writeAction } from "../../../../../lib/actionStore";
import { addDays } from "../../../../../lib/escalation";
import type { CatalogueKey } from "../../../../../lib/content";
import type { Diagnosis } from "../../../../../lib/types/diagnosis";

const FaceCheck = dynamicImport(
  () => import("../../../../../components/FaceCheck").then((m) => m.FaceCheck),
  { ssr: false }
);

/** §12.3: the 5-series is not an allocated Indian mobile series, so a reader
 *  cannot enter a real number here even by accident. */
const DEMO_MOBILE = /^5\d{9}$/;

export function ActView({
  reference, diagnosis, actionId, available, becauseKey, effectDays
}: {
  reference: string;
  diagnosis: Diagnosis;
  actionId: ActionId;
  available: boolean;
  becauseKey: CatalogueKey | null;
  effectDays: number;
}) {
  const { locale } = useLocale();
  const spec = ACTIONS[actionId];
  const href = "/case/" + encodeURIComponent(reference);

  const [doneAt, setDoneAt] = useState<string | null>(null);
  const [mobile, setMobile] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    const found = readActions(reference).find((a) => a.id === actionId);
    setDoneAt(found?.at ?? null);
  }, [reference, actionId]);

  function complete(detail: Record<string, unknown> = {}) {
    const at = new Date().toISOString();
    writeAction(reference, actionId, at);
    setDoneAt(at);
    // Best effort. The device already holds it, so a lost connection cannot
    // lose the completion - the same ordering §8.7 asks for.
    void fetch("/api/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reference, action: actionId, at, detail })
    }).catch(() => { /* offline: recorded on the device regardless */ });
  }

  /* ── Already done ──────────────────────────────────────────────────────── */
  if (doneAt) {
    const effectBy = addDays(doneAt, effectDays).slice(0, 10);
    return (
      <main className="page-in shell pb-16 pt-8">
        <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("act.done_heading", {}, locale)}</h1>
        <p className="mt-4 rounded-card border-2 border-green bg-green-soft p-4 text-body font-semibold text-ink">
          {resolve(spec.doneKey, {}, locale)}
        </p>
        <dl className="mt-6 rounded-card border border-rule bg-paper p-5">
          <dt className="text-label text-ink-soft">{resolve("act.expected", { days: effectDays }, locale)}</dt>
          <dd className="data mt-1 text-answer font-bold text-ink">{effectBy}</dd>
        </dl>
        <p className="mt-4 prose-measure text-body text-ink">{resolve("act.if_passes", { days: effectDays }, locale)}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={href + "/timeline"} className="inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper">
            {resolve("act.done_timeline", {}, locale)}
          </Link>
          <Link href={href + "/fix"} className="inline-flex min-h-14 items-center rounded-card border border-rule px-5 text-body font-semibold text-ink">
            {resolve("act.back", {}, locale)}
          </Link>
        </div>
      </main>
    );
  }

  /* ── Ruled out, with the reason. §10.4 - the line that is the product. ─── */
  if (!available) {
    return (
      <main className="page-in shell pb-16 pt-8">
        <h1 className="text-answer font-semibold leading-tight text-ink">{resolve(spec.titleKey, {}, locale)}</h1>
        <h2 className="mt-8 text-label font-bold uppercase tracking-wide text-ink-soft">
          {resolve("act.ruled_out_heading", {}, locale)}
        </h2>
        <p className="mt-2 rounded-card border-2 border-stop bg-paper p-4 text-body text-ink">
          {becauseKey ? resolve(becauseKey, {}, locale) : resolve("act.ruled_out.not_this_blocker", {}, locale)}
        </p>
        <Link href={href + "/fix"} className="mt-8 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper">
          {resolve("act.back", {}, locale)}
        </Link>
      </main>
    );
  }

  /* ── The action itself ─────────────────────────────────────────────────── */
  return (
    <main className="page-in shell pb-16 pt-8">
      <Link href={href + "/fix"} className="flex min-h-12 items-center text-label font-semibold text-teal-deep underline">
        {resolve("act.back", {}, locale)}
      </Link>

      <h1 className="mt-2 text-answer font-semibold leading-tight text-ink">{resolve(spec.titleKey, {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{resolve(spec.bodyKey, {}, locale)}</p>

      {/* §12.7 - before the control, not after it. */}
      <p className="mt-6 rounded-card border-2 border-pending bg-paper p-4 text-label font-semibold text-ink">
        {resolve(spec.disclosureKey, {}, locale)}
      </p>

      {actionId === "EKYC_FACE" && <FaceCheck onVerified={() => complete({ method: "face" })} />}

      {actionId === "UPDATE_MOBILE" && (
        <div className="mt-6">
          <p className="text-label text-ink-soft">
            {resolve("act.mobile.current", {}, locale)}:{" "}
            <span className="data text-ink">
              {diagnosis.facts.linked_mobile ?? resolve("act.mobile.none", {}, locale)}
            </span>
          </p>
          <label htmlFor="mobile" className="mt-4 block text-label font-semibold text-ink">
            {resolve("act.mobile.label", {}, locale)}
          </label>
          <input
            id="mobile"
            value={mobile}
            inputMode="numeric"
            autoComplete="off"
            onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 10)); setInvalid(false); }}
            className="data mt-2 min-h-14 w-full rounded-card border-2 border-rule bg-paper px-4 text-ink"
          />
          <p className="mt-2 prose-measure text-label text-ink-soft">{resolve("act.mobile.hint", {}, locale)}</p>
          {invalid && (
            <p className="mt-3 rounded-card border-2 border-stop bg-paper p-3 text-body text-ink" role="alert">
              {resolve("act.mobile.invalid", {}, locale)}
            </p>
          )}
          <button
            type="button"
            onClick={() => (DEMO_MOBILE.test(mobile) ? complete({ mobile: "+91 " + mobile }) : setInvalid(true))}
            disabled={mobile.length !== 10}
            className="mt-4 min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
          >
            {resolve("act.mobile.submit", {}, locale)}
          </button>
        </div>
      )}

      {actionId === "CONFIRM_NAME" && (
        <div className="mt-6">
          <h2 className="text-head font-semibold text-ink">{resolve("act.name.choose", {}, locale)}</h2>
          <ul className="mt-4 space-y-3">
            {[
              { key: "act.name.on_aadhaar" as CatalogueKey, value: diagnosis.facts.aadhaar_name },
              { key: "act.name.on_land" as CatalogueKey, value: diagnosis.facts.land_owner_name ?? diagnosis.facts.on_record }
            ].filter((o) => o.value).map((o) => (
              <li key={o.key}>
                <label className={
                  "flex min-h-14 cursor-pointer items-start gap-3 rounded-card border-2 p-4 " +
                  (chosen === o.value ? "border-teal-deep bg-green-soft" : "border-rule bg-paper")
                }>
                  <input
                    type="radio"
                    name="spelling"
                    className="mt-1 size-5 shrink-0"
                    checked={chosen === o.value}
                    onChange={() => setChosen(o.value ?? null)}
                  />
                  <span>
                    <span className="block text-label text-ink-soft">{resolve(o.key, {}, locale)}</span>
                    <span className="data block text-body font-semibold text-ink">{o.value}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => complete({ spelling: chosen })}
            disabled={!chosen}
            className="mt-4 min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
          >
            {resolve("act.name.submit", {}, locale)}
          </button>
        </div>
      )}

      {actionId === "RESEED_AADHAAR" && (
        <div className="mt-6">
          <dl className="rounded-card border border-rule bg-paper p-5">
            <dt className="text-label text-ink-soft">{resolve("act.reseed.account", {}, locale)}</dt>
            <dd className="data text-body font-semibold text-ink">{diagnosis.facts.account_ref}</dd>
            <dt className="mt-3 text-label text-ink-soft">{resolve("act.reseed.bank", {}, locale)}</dt>
            <dd className="data text-body font-semibold text-ink">{diagnosis.facts.bank_name ?? diagnosis.facts.ifsc}</dd>
          </dl>
          <h2 className="mt-6 text-label font-bold uppercase tracking-wide text-ink-soft">
            {resolve("act.reseed.request", {}, locale)}
          </h2>
          {/* The same sentence the Visit Slip prints for a counter clerk. */}
          <p className="mt-2 rounded-card border border-rule bg-cyan-pale p-4 text-body text-ink">
            {resolve("fix.request.MAPPER_INACTIVE", diagnosis.facts, locale)}
          </p>
          <button
            type="button"
            onClick={() => complete({ account: diagnosis.facts.account_ref })}
            className="mt-4 min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper"
          >
            {resolve("act.reseed.submit", {}, locale)}
          </button>
        </div>
      )}

      <p className="mt-6 prose-measure text-label text-ink-soft">{resolve("act.expected", { days: effectDays }, locale)}</p>
    </main>
  );
}
