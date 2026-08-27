import type { Config } from "tailwindcss";

// Colours are CLAUDE.md §11.3. Each name maps to a CSS custom property defined
// in app/globals.css so the token table has exactly one source of truth.
// Usage rules (which pairs are legible) are binding — see §11.3.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // theme — what the product looks like
        "teal-deep": "var(--teal-deep)",
        green: "var(--green)",
        "green-soft": "var(--green-soft)",
        "cyan-pale": "var(--cyan-pale)",
        paper: "var(--white)",

        // functional — one job each, never decorative
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        stop: "var(--stop)",
        pending: "var(--pending)",
        rule: "var(--rule)",
        focus: "var(--focus)"
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
        // §11.5 — near-square reads as document; 999px is the money marker only
        card: "2px",
        marker: "999px"
      }
    }
  },
  plugins: []
};
export default config;
