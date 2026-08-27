"use client";

/* S3 — Verify. CLAUDE.md §11.7.
 *
 * The disclosure sits directly under the field, not in a footer: §12.7 puts it
 * at the high-risk moment, and an OTP box is the moment a person is most likely
 * to believe this is the real service.
 *
 * "Did not get the code?" is the signature dead end (P3, P7). The portal offers
 * an OTP by default to people whose Aadhaar-linked number is dead, and then
 * offers nothing else. Here the dead end is named, and there is a way through
 * it — because the engine already knows whether a code can arrive at all. */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "../../../components/LocaleProvider";
import { resolve } from "../../../content/resolve";

const DEMO_CODE = "123456";

function VerifyForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get("ref") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  function go() {
    router.push("/case/" + encodeURIComponent(reference));
  }

  function submit() {
    if (code.replace(/\D/g, "") === DEMO_CODE) go();
    else setError(true);
  }

  return (
    <main className="shell pb-40 pt-8">
      <h1 className="text-answer font-semibold leading-tight text-ink">{resolve("otp.title", {}, locale)}</h1>
      <p className="mt-3 prose-measure text-body text-ink">{resolve("otp.standfirst", {}, locale)}</p>

      <label htmlFor="otp" className="mt-8 block text-label font-semibold text-ink">
        {resolve("otp.label", {}, locale)}
      </label>
      <input
        id="otp"
        value={code}
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(false); }}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        className="data mt-2 min-h-14 w-full rounded-card border-2 border-rule bg-paper px-4 text-ink tracking-[0.4em]"
      />

      {/* §12.7 — in place, at the high-risk moment. */}
      <p className="mt-3 rounded-card border border-pending bg-paper p-3 text-label font-semibold text-ink">
        {resolve("otp.disclosure", {}, locale)}
      </p>

      {error && (
        <p className="mt-4 rounded-card border-2 border-pending bg-paper p-3 text-body text-ink" role="alert">
          {resolve("otp.wrong", {}, locale)}
        </p>
      )}

      <details className="mt-8 rounded-card border border-rule bg-paper p-4">
        <summary className="cursor-pointer text-body font-semibold text-teal-deep">
          {resolve("otp.didnt_get", {}, locale)}
        </summary>
        <p className="mt-3 prose-measure text-body text-ink">{resolve("otp.didnt_get_body", {}, locale)}</p>
        <button
          type="button"
          onClick={go}
          className="mt-4 min-h-12 rounded-card border border-teal-deep px-4 text-label font-semibold text-teal-deep"
        >
          {resolve("otp.skip", {}, locale)}
        </button>
      </details>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper p-4">
        <div className="shell">
          <button
            type="button"
            onClick={submit}
            disabled={code.length < 6}
            className="min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
          >
            {resolve("otp.submit", {}, locale)}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
