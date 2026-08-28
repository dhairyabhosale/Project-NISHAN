"use client";

import Link from "next/link";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

export default function HowItWorksPage() {
  const { locale } = useLocale();

  const steps = [
    {
      num: "01",
      title: resolve("how_page.step1.title", {}, locale),
      desc: resolve("how_page.step1.desc", {}, locale),
      tag: resolve("how.1.title", {}, locale)
    },
    {
      num: "02",
      title: resolve("how_page.step2.title", {}, locale),
      desc: resolve("how_page.step2.desc", {}, locale),
      tag: resolve("how.2.title", {}, locale)
    },
    {
      num: "03",
      title: resolve("how_page.step3.title", {}, locale),
      desc: resolve("how_page.step3.desc", {}, locale),
      tag: resolve("fix.authority_heading", {}, locale)
    },
    {
      num: "04",
      title: resolve("how_page.step4.title", {}, locale),
      desc: resolve("how_page.step4.desc", {}, locale),
      tag: resolve("how.3.title", {}, locale)
    },
    {
      num: "05",
      title: resolve("how_page.step5.title", {}, locale),
      desc: resolve("how_page.step5.desc", {}, locale),
      tag: resolve("fix.title", {}, locale)
    }
  ];

  const flowNodes = [
    { label: resolve("how_page.flow.citizen", {}, locale), icon: "1" },
    { label: resolve("how_page.flow.interface", {}, locale), icon: "2" },
    { label: resolve("how_page.flow.identity", {}, locale), icon: "3" },
    { label: resolve("how_page.flow.verification", {}, locale), icon: "4" },
    { label: resolve("how_page.flow.diagnosis", {}, locale), icon: "5" },
    { label: resolve("how_page.flow.action", {}, locale), icon: "6" },
    { label: resolve("how_page.flow.resolution", {}, locale), icon: "7" }
  ];

  return (
    <main className="page-in shell pb-20 pt-8">
      <header className="border-b border-rule pb-8">
        <h1 className="text-answer font-semibold text-ink leading-tight">
          {resolve("how_page.title", {}, locale)}
        </h1>
        <p className="mt-2 text-body font-medium tracking-wide text-teal-deep sm:whitespace-nowrap">
          {resolve("how_page.full_name", {}, locale).split(" ").map((word, index) => (
            <span key={`${word}-${index}`}>
              {index > 0 ? " " : ""}
              {word === "&" ? word : (
                <>
                  <strong>{word.charAt(0)}</strong>
                  {word.slice(1)}
                </>
              )}
            </span>
          ))}
        </p>
        <p className="mt-3 max-w-3l text-head text-ink-soft leading-relaxed">
          {resolve("how_page.subtitle", {}, locale)}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link 
            href="/demo" 
            className="inline-flex min-h-12 items-center rounded-card bg-teal-deep px-5 text-label font-semibold text-paper hover:bg-teal-deep/90"
          >
            {resolve("nav.demo", {}, locale)}
          </Link>
          <Link 
            href="/who" 
            className="inline-flex min-h-12 items-center rounded-card border border-teal-deep bg-paper px-5 text-label font-semibold text-teal-deep hover:bg-cyan-pale"
          >
            {resolve("nav.find", {}, locale)}
          </Link>
        </div>
      </header>

      <section className="py-10">
        <h2 className="text-head font-semibold text-ink">
          {resolve("how.heading", {}, locale)}
        </h2>
        <p className="mt-2 text-body text-ink-soft max-w-2l">
          {resolve("how.standfirst", {}, locale)}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.num}
              className="flex flex-col justify-between rounded-card border border-rule bg-paper p-5 transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="data font-bold text-label text-teal-deep">STEP{s.num}</span>
                  <span className="rounded bg-cyan-pale px-2 py-0.5 text-label font-semibold text-ink-soft">
                    {s.tag}
                  </span>
                </div>
                <h3 className="mt-3 text-body font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-label text-ink-soft leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-rule py-10">
        <h2 className="text-head font-semibold text-ink">
          {resolve("how_page.flow.title", {}, locale)}
        </h2>

        <div className="mt-6 rounded-card border border-rule bg-paper p-4 sm:p-6">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={resolve("how_page.flow.title", {}, locale)}>
            {flowNodes.map((node, i) => (
              <li key={node.label} className="relative flex min-h-20 items-center gap-3 rounded-card border border-rule bg-cyan-pale/40 p-4">
                <span className="grid size-8 place-items-center rounded-full bg-teal-deep text-paper font-bold text-label" aria-hidden="true">
                  {node.icon}
                </span>
                <div>
                  <span className="block text-label font-bold uppercase text-ink-soft">{resolve(("how_page.flow.stage." + (i + 1)) as CatalogueKey, {}, locale)}</span>
                  <span className="text-body font-semibold text-ink">{node.label}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>


      <section className="border-t border-rule py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-card border-2 border-teal-deep bg-paper p-6">
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-teal-deep" aria-hidden="true" />
              <h3 className="text-head font-semibold text-ink">
                {resolve("how_page.proto.title", {}, locale)}
              </h3>
            </div>
            <p className="mt-3 text-body text-ink leading-relaxed">
              {resolve("how_page.proto.desc", {}, locale)}
            </p>
            <ul className="mt-4 space-y-2 text-label text-ink-soft">
              <li className="flex items-start gap-2">
                <span className="text-teal-deep font-bold" aria-hidden="true">✓</span>
                <span>{resolve("how_page.proto.point1", {}, locale)}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-deep font-bold" aria-hidden="true">✓</span>
                <span>{resolve("how_page.proto.point2", {}, locale)}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-deep font-bold" aria-hidden="true">✓</span>
                <span>{resolve("how_page.proto.point3", {}, locale)}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-card border border-rule bg-paper p-6">
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-pending" aria-hidden="true" />
              <h3 className="text-head font-semibold text-ink">
                {resolve("how_page.prod.title", {}, locale)}
              </h3>
            </div>
            <p className="mt-3 text-body text-ink leading-relaxed">
              {resolve("how_page.prod.desc", {}, locale)}
            </p>
            <ul className="mt-4 space-y-2 text-label text-ink-soft">
              <li className="flex items-start gap-2">
                <span className="text-pending font-bold" aria-hidden="true">→</span>
                <span>{resolve("how_page.prod.point1", {}, locale)}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pending font-bold" aria-hidden="true">→</span>
                <span>{resolve("how_page.prod.point2", {}, locale)}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pending font-bold" aria-hidden="true">→</span>
                <span>{resolve("how_page.prod.point3", {}, locale)}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-pending bg-paper p-4 text-label font-semibold text-ink">
          <p>{resolve("how_page.disclaimer", {}, locale)}</p>
        </div>
      </section>
    </main>
  );
}
