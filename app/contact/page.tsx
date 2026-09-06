"use client";

/* /contact - reaching a person, and finding the right counter.
 *
 * The form does not submit anywhere. 12.7 puts the disclosure at the moment of
 * risk, so it sits directly above the button rather than in a footer: a contact
 * form is exactly where someone would assume a message reaches a government
 * office. Saying so once, in place, is the difference between a prototype and a
 * misleading one. */

import { useRef, useState, type FormEvent } from "react";
import { OfficeMap } from "./OfficeMap";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";

type Field = "name" | "contact" | "message";

/* Ten digits, or something with an @ and a dot after it. Deliberately loose:
   a strict address pattern rejects real addresses, and the only thing this
   needs to establish is that a reply would have somewhere to go. */
const CONTACTABLE = /^(?:\d[\s-]*){10}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const { locale } = useLocale();
  const [sent, setSent] = useState(false);
  const [values, setValues] = useState({ name: "", contact: "", message: "" });
  /* Errors appear on submit, not while someone is still typing their name.
     Once a field has been marked, it re-checks on every keystroke, so the
     message clears the moment it is fixed rather than on the next submit. */
  const [errors, setErrors] = useState<Record<Field, boolean>>({ name: false, contact: false, message: false });
  const [showSummary, setShowSummary] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const contactRef = useRef<HTMLInputElement | null>(null);
  const msgRef = useRef<HTMLTextAreaElement | null>(null);

  const bad = (f: Field, v: string) =>
    f === "contact" ? !CONTACTABLE.test(v.trim()) : v.trim().length === 0;

  function set(f: Field, v: string) {
    setValues((prev) => ({ ...prev, [f]: v }));
    setErrors((prev) => (prev[f] ? { ...prev, [f]: bad(f, v) } : prev));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = { name: bad("name", values.name), contact: bad("contact", values.contact), message: bad("message", values.message) };
    setErrors(next);
    const first = (["name", "contact", "message"] as Field[]).find((f) => next[f]);
    if (first) {
      setShowSummary(true);
      /* Move the reader to the first thing that needs fixing, rather than
         leaving them to find it. */
      const ref = first === "name" ? nameRef : first === "contact" ? contactRef : msgRef;
      ref.current?.focus();
      return;
    }
    setShowSummary(false);
    setSent(true);
  }

  function again() {
    setValues({ name: "", contact: "", message: "" });
    setErrors({ name: false, contact: false, message: false });
    setSent(false);
    setShowSummary(false);
    window.setTimeout(() => nameRef.current?.focus(), 0);
  }

  const field = (f: Field) =>
    "mt-2 min-h-14 w-full rounded-card border-2 bg-paper px-4 text-body text-ink " +
    (errors[f] ? "border-stop" : "border-rule");

  return (
    <main className="page-in pb-16">
      <section className="on-teal bg-teal-deep py-12 text-paper md:py-16">
        <div className="shell">
          <h1 className="text-answer font-semibold leading-tight">{resolve("contact.title", {}, locale)}</h1>
          <p className="mt-4 prose-measure text-body opacity-95">{resolve("contact.standfirst", {}, locale)}</p>
        </div>
      </section>

      <section className="shell py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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

          <div>
            <h2 className="text-head font-semibold text-ink">{resolve("contact.form_heading", {}, locale)}</h2>

            {sent ? (
              <div className="mt-4">
                <p role="status" className="rounded-card border-2 border-green bg-green-soft p-4 text-body text-ink">
                  {resolve("contact.form_sent", {}, locale)}
                </p>
                <button
                  type="button"
                  onClick={again}
                  className="btn-fill mt-4 min-h-14 w-full rounded-card border-2 border-teal-deep text-body font-semibold text-teal-deep"
                >
                  {resolve("contact.form_another", {}, locale)}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                {showSummary && (
                  <p role="alert" className="mt-4 rounded-card border-2 border-stop bg-paper p-3 text-body font-semibold text-ink">
                    {resolve("contact.err_summary", {}, locale)}
                  </p>
                )}

                <label htmlFor="c-name" className="mt-4 block text-label font-semibold text-ink">
                  {resolve("contact.name_label", {}, locale)}
                </label>
                <input
                  id="c-name"
                  ref={nameRef}
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="name"
                  aria-invalid={errors.name || undefined}
                  aria-describedby={errors.name ? "c-name-err" : undefined}
                  className={field("name")}
                />
                {errors.name && (
                  <p id="c-name-err" className="mt-2 text-label font-semibold text-stop">
                    {resolve("contact.err_name", {}, locale)}
                  </p>
                )}

                <label htmlFor="c-contact" className="mt-4 block text-label font-semibold text-ink">
                  {resolve("contact.contact_label", {}, locale)}
                </label>
                <input
                  id="c-contact"
                  ref={contactRef}
                  value={values.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  inputMode="tel"
                  autoComplete="off"
                  aria-invalid={errors.contact || undefined}
                  aria-describedby={errors.contact ? "c-contact-err" : "c-contact-hint"}
                  className={field("contact")}
                />
                {errors.contact ? (
                  <p id="c-contact-err" className="mt-2 text-label font-semibold text-stop">
                    {resolve("contact.err_contact", {}, locale)}
                  </p>
                ) : (
                  <p id="c-contact-hint" className="mt-2 text-label text-ink-soft">
                    {resolve("contact.optional_hint", {}, locale)}
                  </p>
                )}

                <label htmlFor="c-msg" className="mt-4 block text-label font-semibold text-ink">
                  {resolve("contact.message_label", {}, locale)}
                </label>
                <textarea
                  id="c-msg"
                  ref={msgRef}
                  rows={4}
                  value={values.message}
                  onChange={(e) => set("message", e.target.value)}
                  aria-invalid={errors.message || undefined}
                  aria-describedby={errors.message ? "c-msg-err" : undefined}
                  className={
                    "mt-2 w-full rounded-card border-2 bg-paper p-4 text-body text-ink " +
                    (errors.message ? "border-stop" : "border-rule")
                  }
                />
                {errors.message && (
                  <p id="c-msg-err" className="mt-2 text-label font-semibold text-stop">
                    {resolve("contact.err_message", {}, locale)}
                  </p>
                )}

                {/* 12.7 - at the moment of risk, not in a footer. */}
                <p className="mt-4 rounded-card border border-pending bg-paper p-3 text-label font-semibold text-ink">
                  {resolve("contact.form_disclosure", {}, locale)}
                </p>

                <button type="submit" className="btn-pop mt-4 min-h-14 w-full rounded-card bg-teal-deep text-body font-semibold text-paper">
                  {resolve("contact.send", {}, locale)}
                </button>
              </form>
            )}
          </div>
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
