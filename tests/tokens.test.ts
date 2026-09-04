/* The Tailwind alpha bug, and a guard against its whole class.
 *
 * WHAT HAPPENED. The theme colours were declared as `var(--teal-deep)`, a
 * finished colour. Tailwind builds an opacity modifier by substituting into
 * "rgb(<channels> / <alpha-value>)", so with a finished colour there is nowhere
 * to put the alpha and the utility compiles to something invalid. The browser
 * then discards the declaration:
 *
 *     bg-teal-deep/90   ->  rgba(0, 0, 0, 0)      painted nothing
 *     border-paper/70   ->  rgb(229, 231, 235)    Tailwind's default grey-200
 *
 * Nine call sites were affected. The visible one was the hero's "See a demo
 * case" button, which shipped a grey border on the first screen anyone sees.
 * Nothing errored. Nothing warned. tsc was clean and the build was green.
 *
 * WHY A TEST AND NOT JUST THE FIX. The fix is one line per token and could be
 * undone by anyone who reads `rgb(var(--x) / <alpha-value>)` as noise and
 * "simplifies" it back to `var(--x)`. Nothing would fail. So this asserts the
 * shape of the definitions rather than trusting them to stay that way.
 *
 * The rendered half of this - that no route paints a transparent or an
 * unexpected grey - lives in routes.test.ts, because it needs a browser.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "..");
const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
const config = fs.readFileSync(path.join(ROOT, "tailwind.config.ts"), "utf8");

/** §11.3's palette, and the two focus tokens that share its mechanism. */
const TOKENS = [
  "teal-deep", "green", "green-soft", "cyan-pale", "white",
  "ink", "ink-soft", "stop", "pending", "rule", "focus", "focus-on-teal"
];

describe("design tokens - the alpha channel must survive", () => {
  it("declares every colour as space-separated channels, not a finished colour", () => {
    for (const t of TOKENS) {
      const m = css.match(new RegExp("--" + t + ":\\s*([^;]+);"));
      assert.ok(m, "--" + t + " is not declared");
      const value = m[1].trim();
      assert.match(value, /^\d{1,3} \d{1,3} \d{1,3}$/,
        "--" + t + " is \"" + value + "\". A finished colour here makes every /NN modifier paint nothing.");
    }
  });

  it("keeps the channels inside 0-255", () => {
    for (const t of TOKENS) {
      const value = css.match(new RegExp("--" + t + ":\\s*([^;]+);"))![1].trim();
      for (const n of value.split(" ").map(Number)) {
        assert.ok(n >= 0 && n <= 255, "--" + t + " has an out-of-range channel: " + value);
      }
    }
  });

  it("gives every Tailwind colour an <alpha-value> slot", () => {
    // Without the slot the modifier cannot be built, which is the entire bug.
    const colours = config.match(/colors:\s*\{[\s\S]*?\n {6}\}/);
    assert.ok(colours, "could not find the colours block");
    for (const line of colours[0].split("\n")) {
      if (!line.includes("var(--")) continue;
      assert.match(line, /rgb\(var\(--[a-z-]+\) \/ <alpha-value>\)/,
        "a colour is mapped without an alpha slot: " + line.trim());
    }
  });

  it("never uses a bare var(--colour) in CSS, which would now be invalid", () => {
    // The channels are not a colour on their own. A bare var() would silently
    // produce nothing, which is the same failure wearing the opposite clothes.
    for (const t of TOKENS) {
      const bare = new RegExp("[^(]var\\(--" + t + "\\)", "g");
      const hits = css.match(bare) ?? [];
      assert.equal(hits.length, 0,
        "--" + t + " is used bare in globals.css; it must be rgb(var(--" + t + "))");
    }
  });

  it("still matches the §11.3 palette after the conversion", () => {
    // The point of the change was the alpha slot, not new colours. If a channel
    // triple drifts, every measured contrast ratio in §11.3 stops being true.
    const EXPECTED: Record<string, string> = {
      "teal-deep": "0 121 107",     // #00796B
      "green": "76 175 80",         // #4CAF50
      "green-soft": "165 214 167",  // #A5D6A7
      "cyan-pale": "224 247 250",   // #E0F7FA
      "white": "255 255 255",       // #FFFFFF
      "ink": "16 36 31",            // #10241F
      "ink-soft": "72 107 100",     // #486B64
      "stop": "198 40 40",          // #C62828
      "pending": "239 108 0",       // #EF6C00
      "rule": "178 223 219"         // #B2DFDB
    };
    for (const [t, want] of Object.entries(EXPECTED)) {
      const got = css.match(new RegExp("--" + t + ":\\s*([^;]+);"))![1].trim();
      assert.equal(got, want, "--" + t + " changed colour during the alpha fix");
    }
  });
});
