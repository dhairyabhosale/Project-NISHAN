/* AUDIT.md F5 - the test that should have existed.
 *
 * Four separate suites already assert that no banned system vocabulary appears
 * in the catalogues. All four passed while
 *
 *   mocks/fixtures.ts: demonstrates: "B4 mapper inactive - approved money ..."
 *
 * was rendered on /who and /demo, because a fixture is not a catalogue and no
 * test looked outside content/*.json. The word "mapper" reached the first
 * screen after entry and nothing failed.
 *
 * So these suites check the two surfaces the catalogue tests cannot see:
 *
 *   1. every string literal in the source that could reach a screen, and
 *   2. every string literal in the fixtures, which feed the screens with data.
 *
 * They are deliberately source-level rather than render-level. app/ and
 * components/ are excluded from tsconfig.test.json, so the suite cannot import
 * a component; reading the files is what is available, and it is enough to
 * catch the class of bug that actually shipped. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "..");

/** §16.5. Forbidden in anything a farmer can read, in any language. */
const BANNED = /\b(npci|fto|mapper|seeding|seeded|dbt|pfms|rft)\b/i;

/**
 * The seven strings the official portal itself shows (§3.2).
 *
 * These are the one allowed exception, and only as an exact whole-string match.
 * §11.7 S4 requires the raw portal status to be quoted verbatim in mono beside
 * the verdict, so the reader can match what we say against what she already saw
 * on the government site. Several of them contain banned words because the
 * government wrote them: "Aadhaar Seeding Status: No", "FTO Generated".
 *
 * Quoting the portal is evidence. Writing like the portal is the thing §16.5
 * forbids. The distinction is exact-match: a literal that merely CONTAINS one
 * of these still fails, so nobody can pad jargon onto a portal string and pass.
 */
const PORTAL_STRINGS = new Set([
  "FTO Generated, Payment Under Process",
  "Rft Signed by State Government",
  "Rejected by Bank",
  "Stopped by State",
  "eKYC Required",
  "Aadhaar Seeding Status: No",
  "Payment Success"
]);

function allowed(lit: string): boolean {
  return PORTAL_STRINGS.has(lit.trim());
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Strip comments so an explanatory note about the real pipeline is allowed.
 *  §16.5 governs what a user reads, not what a maintainer reads. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Double-quoted literals of three or more characters, which is the shape of
 *  every piece of prose in this codebase. */
function literals(src: string): string[] {
  return (stripComments(src).match(/"[^"\\\n]{3,}"/g) ?? []).map((s) => s.slice(1, -1));
}

/**
 * Is this literal PROSE, as opposed to data?
 *
 * The distinction matters and is the second half of the rule. "FTO-2026-23-0042"
 * is an identifier in a mock payment record: it has no spaces, it is never
 * rendered, and banning it would be banning the mock systems from modelling the
 * real ones. §16.5 governs the words a farmer READS. So only multi-word literals
 * are checked, which is exactly the shape the offending string had:
 * "B4 mapper inactive - approved money with nowhere to land".
 */
function isProse(s: string): boolean {
  if (!/\s/.test(s)) return false;                        // single tokens
  if (/^[a-z0-9:_\-/[\]().#%\s]+$/.test(s) && !/[A-Z]/.test(s)) {
    // all-lowercase with no capital: Tailwind class lists, css, paths
    if (/(^|\s)(flex|grid|mt-|mb-|px-|py-|text-|bg-|border|rounded|min-h|w-full|absolute|relative|inline|shrink|gap-)/.test(s)) return false;
  }
  return /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(s);
}

describe("F5 - no banned system vocabulary in any source string", () => {
  const files = [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "components")),
                 ...walk(path.join(ROOT, "mocks")), ...walk(path.join(ROOT, "lib")),
                 ...walk(path.join(ROOT, "content")), ...walk(path.join(ROOT, "engine"))];

  it("found the source tree", () => {
    assert.ok(files.length > 20, "only found " + files.length + " source files");
  });

  it("has no banned word in any string literal that could reach a screen", () => {
    for (const f of files) {
      const rel = path.relative(ROOT, f);
      for (const lit of literals(fs.readFileSync(f, "utf8"))) {
        if (!isProse(lit) || allowed(lit)) continue;
        assert.equal(BANNED.test(lit), false, rel + ' :: "' + lit + '"');
      }
    }
  });
});

describe("F5 - fixtures carry data, never prose for the screen", () => {
  const fixtures = fs.readFileSync(path.join(ROOT, "mocks", "fixtures.ts"), "utf8");

  it("has no banned word in any fixture string", () => {
    for (const lit of literals(fixtures)) {
      if (!isProse(lit) || allowed(lit)) continue;
      assert.equal(BANNED.test(lit), false, 'mocks/fixtures.ts :: "' + lit + '"');
    }
  });

  it("no longer carries a `demonstrates` description field", () => {
    // It was a user-facing sentence living in the data layer, which is how it
    // escaped every content test. Persona descriptions are catalogue keys now.
    assert.equal(/\bdemonstrates\s*:/.test(fixtures), false, "fixtures.ts has a demonstrates field again");
  });
});

describe("F5 - persona descriptions come from the catalogue", () => {
  const REFS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
  const cat = (loc: string) =>
    JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalogue." + loc + ".json"), "utf8")) as Record<string, string>;

  it("has a stopped label and a summary for every persona, in every locale", () => {
    for (const loc of ["en", "hi", "ta", "mr"]) {
      const c = cat(loc);
      for (const r of REFS) {
        for (const suffix of [".stopped", ".summary"]) {
          const key = "persona." + r + suffix;
          assert.ok(c[key] && c[key].trim().length > 0, loc + " missing " + key);
        }
      }
    }
  });

  it("describes personas without blocker codes or reason codes", () => {
    // "B4" and "MAPPER_INACTIVE" are how the engine talks to itself. A reader
    // gets an outcome instead.
    const CODE = /\b(B[0-6][a-c]?|[A-Z]{3,}_[A-Z_]{3,})\b/;
    for (const loc of ["en", "hi", "mr"]) {
      const c = cat(loc);
      for (const r of REFS) {
        for (const suffix of [".stopped", ".summary"]) {
          const key = "persona." + r + suffix;
          assert.equal(CODE.test(c[key]), false, loc + " " + key + ": " + c[key]);
        }
      }
    }
  });
});

describe("F5 - the portal-string exemption cannot be abused", () => {
  it("only exempts an exact whole-string match", () => {
    // Padding jargon onto a portal string must still fail, or the exemption
    // becomes a way to smuggle system vocabulary onto a screen.
    assert.equal(allowed("Aadhaar Seeding Status: No"), true);
    assert.equal(allowed("Your Aadhaar Seeding Status: No, contact NPCI"), false);
    assert.equal(allowed("seeding"), false);
  });

  it("exempts nothing that is not one of the seven documented strings", () => {
    assert.equal(PORTAL_STRINGS.size, 7);
  });
});

describe("F5 - the prose filter still catches the string that shipped", () => {
  it("treats the offending sentence as prose", () => {
    const offender = "B4 mapper inactive - approved money with nowhere to land";
    assert.equal(isProse(offender), true, "would no longer be checked");
    assert.equal(allowed(offender), false, "must not be exempt");
    assert.equal(BANNED.test(offender), true, "must still trip the banned list");
  });

  it("treats a bare identifier as data, not prose", () => {
    assert.equal(isProse("FTO-2026-23-0042"), false);
    assert.equal(isProse("MOCKACC-4471"), false);
  });
});
