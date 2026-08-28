/* Name comparison for B5 - CLAUDE.md §7.2, §8.4.
 *
 * This is the most consequential rule in the engine, because both failure modes
 * are expensive and they pull in opposite directions:
 *
 *   Too strict → "Ramesh P." is flagged against "Ramesh Pandian", and a farmer
 *                loses a day's wage and a bus fare visiting a revenue office
 *                over a spelling.
 *   Too loose  → "Murugesan Kandasamy" passes as "Sarala Murugesan", the real
 *                blocker is missed, and she is told to wait for money that will
 *                never arrive.
 *
 * The distinction the rule has to draw is not "how similar are these strings"
 * but "are these the same person". Two devices carry that:
 *
 *   1. Transliteration folding. Indic names romanise inconsistently - Fatima /
 *      Fathima, Lakshmi / Laxmi. Same name, different clerk.
 *   2. Initial expansion. "Ramesh P." and "Ramesh Pandian" differ because one
 *      form was abbreviated, not because the person differs.
 *
 * And one guard: the leading given name must be compatible. Sharing a surname
 * is not sharing an identity - land held by a father and claimed by a daughter
 * shares "Murugesan" and is still a different person. That guard is what makes
 * Sarala and Selvi flag while Ramesh and Fatima do not. */

/** Conservative romanisation folding. Every rule here collapses spellings that
 *  Indian clerks demonstrably use interchangeably. Nothing here merges two
 *  names that are actually different - that would be the expensive error. */
function fold(token: string): string {
  let t = token.toLowerCase().replace(/[^a-z]/g, "");
  t = t.replace(/th/g, "t");   // Fathima  -> Fatima
  t = t.replace(/ph/g, "f");   // Phanindra -> Fanindra
  t = t.replace(/ksh/g, "x");  // Lakshmi  -> Laxmi
  t = t.replace(/w/g, "v");    // Waheeda  -> Vaheeda
  t = t.replace(/aa/g, "a").replace(/ee/g, "i").replace(/ii/g, "i");
  t = t.replace(/oo/g, "u").replace(/uu/g, "u");
  t = t.replace(/(.)\1+/g, "$1"); // collapse doubled letters
  return t;
}

function tokenise(name: string): string[] {
  return name
    .split(/[\s.,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(fold)
    .filter(Boolean);
}

/** A single letter stands for any token beginning with it: "d" matches "devi". */
function tokensCompatible(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length === 1) return b.startsWith(a);
  if (b.length === 1) return a.startsWith(b);
  return false;
}

export interface NameComparison {
  match: boolean;
  /** Plain-language reason, suitable for Evidence.note and a Visit Slip. */
  note: string;
  normalisedA: string;
  normalisedB: string;
}

/**
 * Do these two records name the same person?
 *
 * Deterministic: pure string work, no randomness, no locale-sensitive calls.
 */
export function compareNames(a: string, b: string): NameComparison {
  const ta = tokenise(a);
  const tb = tokenise(b);
  const normalisedA = ta.join(" ");
  const normalisedB = tb.join(" ");

  if (!ta.length || !tb.length) {
    return { match: false, note: "One of the records has no name recorded.", normalisedA, normalisedB };
  }

  // Guard: the leading given name must be compatible. A shared surname is not a
  // shared identity - this is what separates an abbreviation from a different
  // person, and it is the whole reason Sarala and Selvi flag.
  if (!tokensCompatible(ta[0], tb[0])) {
    return {
      match: false,
      note: "The land record is in a different person's name, not a different spelling of the same name.",
      normalisedA,
      normalisedB
    };
  }

  // Every token of the shorter name must find a partner in the longer one.
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const pool = [...longer];
  for (const token of shorter) {
    const i = pool.findIndex((candidate) => tokensCompatible(token, candidate));
    if (i === -1) {
      return {
        match: false,
        note: "The two records carry different names for this land.",
        normalisedA,
        normalisedB
      };
    }
    pool.splice(i, 1);
  }

  return {
    match: true,
    note: "The two records spell the same name differently. This is not a mismatch.",
    normalisedA,
    normalisedB
  };
}
