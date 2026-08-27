"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   DEV-ONLY SURFACE — DELETE BEFORE SUBMISSION.

   Not part of the citizen product and not on the primary path, so the §16.4
   "zero hardcoded user-facing strings in JSX" rule is deliberately not applied
   here: adding ~20 keys to three catalogues for a route that gets deleted would
   pollute the content layer. Every string below is a technical label.

   Values are read from the live CSS custom properties in app/globals.css via
   getComputedStyle, so this page verifies the tokens rather than duplicating
   them. If a swatch renders empty, that token is missing from globals.css.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";

const THEME = ["--teal-deep", "--green", "--green-soft", "--cyan-pale", "--white"] as const;
const FUNCTIONAL = ["--ink", "--ink-soft", "--stop", "--pending", "--rule", "--focus"] as const;

const ROLES: Record<string, string> = {
  "--teal-deep": "Primary. Header band, primary buttons, rail line, money marker.",
  "--green": "Cleared gates, credited state, success.",
  "--green-soft": "Passed-gate fills, quiet success backgrounds.",
  "--cyan-pale": "Page background, card wells, section separation.",
  "--white": "Card surfaces.",
  "--ink": "Body text.",
  "--ink-soft": "Secondary text and labels only. Never body copy.",
  "--stop": "The blocked gate and nothing else. At most once per screen.",
  "--pending": "In-flight, SLA countdown, offline strip. Fill only, never text.",
  "--rule": "Hairlines, dividers, inactive rail segments.",
  "--focus": "Focus ring, 3px, offset 2px."
};

// text token, background token, what it is used for, and whether §11.9's 7:1
// body-text floor applies to this pair.
const PAIRS: [string, string, string, boolean][] = [
  ["--ink", "--white", "body text on cards", true],
  ["--ink", "--cyan-pale", "body text on page background", true],
  ["--ink", "--green-soft", "text on soft success fill", true],
  ["--ink", "--green", "check glyph on passed gate", false],
  ["--ink", "--pending", "text on pending fill", false],
  ["--ink-soft", "--white", "secondary text on cards", false],
  ["--ink-soft", "--cyan-pale", "secondary text on page background", false],
  ["--white", "--teal-deep", "button + header labels", false],
  ["--white", "--stop", "blocked gate label", false],
  ["--white", "--pending", "MUST NOT USE", false],
  ["--white", "--green", "MUST NOT USE", false],
  ["--rule", "--cyan-pale", "hairline on page background", false]
];

function srgb(hex: string): number[] | null {
  const m = hex.trim().replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  return (m[1].match(/../g) as string[]).map((h) => parseInt(h, 16) / 255);
}
function luminance(hex: string): number | null {
  const c = srgb(hex);
  if (!c) return null;
  const l = c.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
}
function contrast(a: string, b: string): number | null {
  const [x, y] = [luminance(a), luminance(b)];
  if (x === null || y === null) return null;
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

function Swatch({ token, hex }: { token: string; hex: string }) {
  return (
    <li className="flex items-stretch gap-3 rounded-card border border-rule bg-paper">
      <span className="w-20 shrink-0 rounded-l-card border-r border-rule" style={{ background: hex }} />
      <span className="py-3 pr-3">
        <span className="data block text-ink">{token}</span>
        <span className="data block text-ink-soft">{hex || "MISSING"}</span>
        <span className="mt-1 block text-label text-ink-soft">{ROLES[token]}</span>
      </span>
    </li>
  );
}

export default function TokensPage() {
  const [v, setV] = useState<Record<string, string>>({});

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const all = [...THEME, ...FUNCTIONAL];
    const next: Record<string, string> = {};
    for (const t of all) next[t] = cs.getPropertyValue(t).trim();
    setV(next);
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="rounded-card border-2 border-pending bg-paper p-4">
        <p className="text-label font-bold uppercase tracking-wide text-ink">Dev surface — delete before submission</p>
        <p className="mt-1 text-label text-ink-soft">CLAUDE.md §11.3 tokens, read live from globals.css.</p>
      </header>

      <h2 className="mt-8 text-head font-semibold text-ink">Theme colours</h2>
      <ul className="mt-3 space-y-2">
        {THEME.map((t) => <Swatch key={t} token={t} hex={v[t] ?? ""} />)}
      </ul>

      <h2 className="mt-8 text-head font-semibold text-ink">Functional additions</h2>
      <ul className="mt-3 space-y-2">
        {FUNCTIONAL.map((t) => <Swatch key={t} token={t} hex={v[t] ?? ""} />)}
      </ul>

      <h2 className="mt-8 text-head font-semibold text-ink">Contrast</h2>
      <p className="mt-1 text-label text-ink-soft">
        §11.9 requires 7:1 for body text. Pairs marked “body” must clear it; the rest need 4.5:1 for
        normal text or 3:1 for graphical objects.
      </p>
      <ul className="mt-3 space-y-2">
        {PAIRS.map(([fg, bg, use, isBody]) => {
          const ratio = contrast(v[fg] ?? "", v[bg] ?? "");
          const need = isBody ? 7 : 4.5;
          const ok = ratio !== null && ratio >= need;
          const banned = use === "MUST NOT USE";
          return (
            <li key={fg + bg} className="rounded-card border border-rule bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="data text-ink">{fg} on {bg}</span>
                <span className="data font-bold text-ink">{ratio ? ratio.toFixed(2) : "—"}</span>
              </div>
              <div
                className="mt-2 rounded-card px-3 py-2"
                style={{ background: v[bg] ?? "transparent", color: v[fg] ?? "inherit" }}
              >
                <span className="text-body">The quick brown fox — ₹2,000</span>
              </div>
              <p className="mt-2 text-label text-ink-soft">
                {use} · needs {need}:1 ·{" "}
                <span className="font-bold" style={{ color: banned || !ok ? "var(--stop)" : "var(--teal-deep)" }}>
                  {banned ? "BANNED BY §11.3" : ok ? "PASS" : "FAIL"}
                </span>
              </p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-head font-semibold text-ink">Type scale</h2>
      <ul className="mt-3 space-y-2 rounded-card border border-rule bg-paper p-4">
        <li className="text-answer font-semibold text-ink">--t-answer 30px · the verdict</li>
        <li className="text-head font-semibold text-ink">--t-head 22px · screen titles</li>
        <li className="text-body text-ink">--t-body 18px · never below this</li>
        <li className="text-label text-ink-soft">--t-label 15px · rail and field labels</li>
        <li className="data text-ink">--t-data 17px · NSH-4F2A · ₹2,000 · 20 Jun 2026</li>
      </ul>
    </main>
  );
}
