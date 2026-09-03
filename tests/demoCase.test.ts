/* AUDIT.md F17 - lib/demoCase.ts and lib/languages.ts, neither of which had
 * any coverage.
 *
 * demoCase encodes a user-built case into its own link instead of storing it,
 * so the decoder is the trust boundary: everything it returns came from a URL a
 * stranger can edit. languages backs the selector, whose honesty about which
 * locales actually resolve is a §10.2 requirement and a /whats-real claim. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encodeSpec, decodeSpec, availableBlockers, personaForSpec, type DemoSpec } from "../lib/demoCase";
import { LANGUAGES, CATALOGUE_LOCALES, isResolved, localeFor } from "../lib/languages";
import { PERSONAS } from "../mocks/fixtures";
import { SYSTEM_CODES } from "../lib/types/systems";

describe("F17 - demo spec encode/decode round-trip", () => {
  it("round-trips every offered blocker", () => {
    for (const b of availableBlockers()) {
      const spec: DemoSpec = { n: "Test Person", b: b.blocker };
      assert.deepEqual(decodeSpec(encodeSpec(spec)), spec, b.blocker);
    }
  });

  it("round-trips names with spaces, punctuation and non-Latin script", () => {
    for (const n of ["Ramesh P.", "A B C", "लक्ष्मी देवी", "O'Brien", "Anne-Marie"]) {
      assert.equal(decodeSpec(encodeSpec({ n, b: "B3" }))!.n, n, n);
    }
  });

  it("produces a URL-safe token with no characters needing escaping", () => {
    for (const n of ["लक्ष्मी देवी", "A B/C+D=E", "x?y&z"]) {
      const t = encodeSpec({ n, b: "B3" });
      assert.match(t, /^[A-Za-z0-9_-]+$/, "not base64url: " + t);
      assert.equal(encodeURIComponent(t), t, "token would be escaped in a URL: " + t);
    }
  });

  it("caps the name at 40 characters on the way in and out", () => {
    const long = "x".repeat(200);
    assert.equal(decodeSpec(encodeSpec({ n: long, b: "B3" }))!.n.length, 40);
  });

  it("trims the name", () => {
    assert.equal(decodeSpec(encodeSpec({ n: "   Padded   ", b: "B3" }))!.n, "Padded");
  });
});

describe("F17 - decodeSpec rejects everything it should", () => {
  it("rejects malformed and hostile input rather than throwing", () => {
    const bad = [
      "", "!!!!", "not-base64url", "%%%",
      Buffer.from("not json").toString("base64url"),
      Buffer.from("[]").toString("base64url"),
      Buffer.from("null").toString("base64url"),
      Buffer.from('{"n":"x"}').toString("base64url"),              // no blocker
      Buffer.from('{"b":"B3"}').toString("base64url"),             // no name
      Buffer.from('{"n":123,"b":"B3"}').toString("base64url"),     // wrong type
      Buffer.from('{"n":"x","b":{"$ne":1}}').toString("base64url"),// object where a string belongs
      Buffer.from('{"n":"   ","b":"B3"}').toString("base64url"),   // whitespace-only name
      Buffer.from('{"n":"x","b":"B9"}').toString("base64url"),     // blocker nothing demonstrates
      Buffer.from('{"n":"x","b":"NOT_A_BLOCKER"}').toString("base64url")
    ];
    for (const t of bad) assert.equal(decodeSpec(t), null, JSON.stringify(t).slice(0, 48));
  });

  it("only accepts a blocker some fixture actually demonstrates", () => {
    const real = new Set(PERSONAS.map((p) => p.expects.blocker));
    for (const b of real) {
      assert.ok(decodeSpec(encodeSpec({ n: "x", b })), b + " should be accepted");
    }
    assert.equal(decodeSpec(encodeSpec({ n: "x", b: "B7" })), null);
  });
});

describe("F17 - personaForSpec builds a usable, synthetic person", () => {
  it("builds a persona for every offered blocker", () => {
    for (const b of availableBlockers()) {
      const p = personaForSpec({ n: "Test Person", b: b.blocker });
      assert.ok(p, b.blocker);
      for (const code of SYSTEM_CODES) assert.notEqual(p[code], null, b.blocker + " missing " + code);
    }
  });

  it("is deterministic: one spec always yields the same person", () => {
    const a = personaForSpec({ n: "Same Name", b: "B3" });
    const c = personaForSpec({ n: "Same Name", b: "B3" });
    assert.deepEqual(a, c);
  });

  it("uses the supplied name", () => {
    assert.ok(JSON.stringify(personaForSpec({ n: "Zarina Khan", b: "B3" })).includes("Zarina Khan"));
  });

  it("§12.3: every identifier it invents is structurally invalid as a real one", () => {
    for (const b of availableBlockers()) {
      const p = personaForSpec({ n: "Test Person", b: b.blocker })!;
      assert.match(p.mUIDAI!.aadhaar_ref.replace(/\s/g, ""), /^9999\d{8}$/, b.blocker + " Aadhaar");
      assert.match(p.mSCHEME!.reg_no, /^NSHDEMO-\d{4}$/, b.blocker + " registration");
      assert.match(p.mBANK!.account_ref, /^MOCKACC-\d{4}$/, b.blocker + " account");
      if (p.mUIDAI!.linked_mobile) {
        assert.match(p.mUIDAI!.linked_mobile.replace(/[\s-]/g, ""), /^\+915\d{9}$/, b.blocker + " mobile");
      }
    }
  });

  it("returns null for a blocker nothing demonstrates", () => {
    assert.equal(personaForSpec({ n: "x", b: "B9" }), null);
  });
});

describe("F17 - the language list is honest about itself", () => {
  it("offers the full set the official portal offers", () => {
    assert.ok(LANGUAGES.length >= 12, "only " + LANGUAGES.length + " languages listed");
  });

  it("gives every language a code, an English name and an endonym", () => {
    for (const l of LANGUAGES) {
      assert.ok(l.code.length >= 2, l.code);
      assert.ok(l.english.length > 0, l.code + " english");
      assert.ok(l.endonym.length > 0, l.code + " endonym");
    }
  });

  it("uses a unique code per language", () => {
    assert.equal(new Set(LANGUAGES.map((l) => l.code)).size, LANGUAGES.length);
  });

  it("marks a language resolved only if a catalogue exists for it", () => {
    // §10.2: a language may not claim to be resolved without the strings to
    // back it. This is the assertion behind the /whats-real Languages row.
    for (const l of LANGUAGES.filter((x) => x.resolved)) {
      assert.ok((CATALOGUE_LOCALES as readonly string[]).includes(l.code),
        l.english + " claims resolved but ships no catalogue");
    }
  });

  it("isResolved agrees with the list", () => {
    for (const l of LANGUAGES) assert.equal(isResolved(l.code), l.resolved, l.code);
    assert.equal(isResolved("zz"), false);
  });

  it("localeFor falls back to English for anything unresolved", () => {
    assert.equal(localeFor("en"), "en");
    for (const l of LANGUAGES.filter((x) => !x.resolved)) {
      assert.equal(localeFor(l.code), "en", l.code + " should fall back rather than half-translate");
    }
    assert.equal(localeFor("nonsense"), "en");
  });
});
