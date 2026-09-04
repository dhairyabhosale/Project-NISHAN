import type { Config } from "tailwindcss";

// Colours are CLAUDE.md §11.3. Each name maps to a CSS custom property defined
// in app/globals.css so the token table has exactly one source of truth.
//
// The <alpha-value> slot is load-bearing. Without it Tailwind cannot build a
// colour for bg-teal-deep/90, so the modifier silently paints nothing - which
// is exactly what shipped at nine call sites. See the note in globals.css.
// Usage rules (which pairs are legible) are binding - see §11.3.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // theme - what the product looks like
        "teal-deep": "rgb(var(--teal-deep) / <alpha-value>)",
        green: "rgb(var(--green) / <alpha-value>)",
        "green-soft": "rgb(var(--green-soft) / <alpha-value>)",
        "cyan-pale": "rgb(var(--cyan-pale) / <alpha-value>)",
        paper: "rgb(var(--white) / <alpha-value>)",

        // functional - one job each, never decorative
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        stop: "rgb(var(--stop) / <alpha-value>)",
        pending: "rgb(var(--pending) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        focus: "rgb(var(--focus) / <alpha-value>)"
      },
      fontSize: {
        answer: ["var(--t-answer)", { lineHeight: "1.2", fontWeight: "600" }],
        head: ["var(--t-head)", { lineHeight: "1.3", fontWeight: "600" }],
        body: ["var(--t-body)", { lineHeight: "1.55" }],
        label: ["var(--t-label)", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        data: ["var(--t-data)", { lineHeight: "1.4" }]
      },
      fontFamily: {
        sans: ["var(--font-anek)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        // §11.5 - near-square reads as document; 999px is the money marker only
        card: "2px",
        marker: "999px"
      }
    }
  },
  plugins: []
};
export default config;
