"use client";

/* /contact - reaching a person, and finding the right counter.
 *
 * The form does not submit anywhere. 12.7 puts the disclosure at the moment of
 * risk, so it sits directly above the button rather than in a footer: a contact
 * form is exactly where someone would assume a message reaches a government
 * office. Saying so once, in place, is the difference between a prototype and a
 * misleading one. */

import { useState, type FormEvent } from "react";
import { OfficeMap } from "./OfficeMap";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";

export default function ContactPage() {
  const { locale } = useLocale();
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main className="page-in pb-16">
      <section className="on-teal bg-teal-deep py-12 text-paper md:py-16">
        <div className="shell">
          <h1 className="text-answer font-semibold leading-tight">{resolve("contact.title", {}, locale)}</h1>
          <p className="mt-4 prose-measure text-body opacity-95">{resolve("contact.standfirst", {}, locale)}</p>
        </div>
      </section>

      <section className="shell py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-head font-semibold text-ink">{resolve("contact.reach_heading", {}, locale)}</h2>
            <dl className="mt-4 space-y-4">
              <div className="rounded-card border border-rule bg-paper p-4">
                <dt className="text-label font-semibold uppercase tracking-wide text-ink-soft">
                  {resolve("contact.phone_label", {}, locale)}
                </dt>
                <dd className="data mt-1 text-head text-ink">{resolve("contact.phone_value", {}, locale)}</dd>
                <dd className="mt-1 text-label text-ink-soft">{resolve("contact.phone_note", {}, locale)}</dd>
              </div>
              <div className="rounded-card border border-rule bg-paper p-4">
                <dt className="text-label font-semibold uppercase tracking-wide text-ink-soft">
                  {resolve("contact.email_label", {}, locale)}
                </dt>
                <dd className="data mt-1 text-body text-ink">{resolve("contact.email_value", {}, locale)}</dd>
                <dd className="mt-1 text-label text-ink-soft">{resolve("contact.email_note", {}, locale)}</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={submit}>
            <h2 className="text-head font-semibold text-ink">{resolve("contact.form_heading", {}, locale)}</h2>

            <label htmlFor="c-name" className="mt-4 block text-label font-semibold text-ink">
              {resolve("contact.name_label", {}, locale)}
            </label>
            <input id="c-name" autoComplete="off" className="mt-2 min-h-14 w-full rounded-card border-2 border-rule bg-paper px-4 text-body text-ink" />

            <label htmlFor="c-contact" className="mt-4 block text-label font-semibold text-ink">
              {resolve("contact.contact_label", {}, locale)}
            </label>
            <input id="c-contact" inputMode="tel" autoComplete="off" className="mt-2 min-h-14 w-full rounded-card border-2 border-rule bg-paper px-4 text-body text-ink" />

            <label htmlFor="c-msg" className="mt-4 block text-label font-semibold text-ink">
              {resolve("contact.message_label", {}, locale)}
            </label>
            <textarea id="c-msg" rows={4} className="mt-2 w-full rounded-card border-2 border-rule bg-paper p-4 text-body text-ink" />

            {/* 12.7 - at the moment of risk, not in a footer. */}
            <p className="mt-4 rounded-card border border-pending bg-paper p-3 text-label font-semibold text-ink">
              {resolve("contact.form_disclosure", {}, locale)}
            </p>

            {sent && (
              <p role="status" className="mt-4 rounded-card border-2 border-green bg-green-soft p-3 text-body text-ink">
                {resolve("contact.form_sent", {}, locale)}
              </p>
            )}

            <button type="submit" className="mt-4 min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper">
              {resolve("contact.send", {}, locale)}
            </button>
          </form>
        </div>
      </section>

      <section className="border-t border-rule bg-paper py-12">
        <div className="shell">
          <h2 className="text-head font-semibold text-ink">{resolve("contact.map_heading", {}, locale)}</h2>
          <p className="mt-2 prose-measure text-body text-ink">{resolve("contact.map_standfirst", {}, locale)}</p>
          <div className="mt-6">
            <OfficeMap />
          </div>
        </div>
      </section>
    </main>
  );
}
