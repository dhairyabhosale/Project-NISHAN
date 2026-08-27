# NISHAN — Build Log

One entry per work session: what was built, what Codex generated versus what was
written afterwards, and every decision or reversal worth remembering.

This file and [CREDITS.md](CREDITS.md) are the raw material for the second minute
of the submission video (§17, 1:45–1:55) and are how hackathon requirement **R1**
is evidenced. Keep them current — see CLAUDE.md §16.14.

Times are IST.

---

## Session 1 — 26 August 2026, 17:14–17:22 — Codex scaffold

**Author: OpenAI Codex.** Single generation run, start to finish in about eight
minutes. See [CREDITS.md](CREDITS.md) for the file-by-file attribution and for
the evidence this attribution rests on.

### What was generated

A complete, type-checking Next.js 14 App Router scaffold:

- **Project config** — `package.json` (already named `pm-kisan-nishan`),
  `tsconfig.json` with `strict: true`, Tailwind 3, PostCSS, `next.config.mjs`.
  Dependency set is deliberately minimal: React, React DOM, Next. No component
  library, no state library, no ORM — consistent with CLAUDE.md §8.3 and §16.11.
- **Type layer** — `lib/types/{blocker,case,events,systems}.ts`.
- **Content layer** — `content/catalogue.en.json` and `catalogue.hi.json`
  (79 keys each, identical key sets), `content/resolve.ts` slot-filler,
  `content/statusCodes.json`, and `lib/content.ts` deriving `CatalogueKey` from
  the English catalogue so a mistyped key is a compile error.
- **Four routes** — `/`, `/assisted`, `/case/[id]`, `/whats-real`.
- **Thirteen components**, including the Money Rail trio (`MoneyRail`,
  `RailGate`, `MoneyMarker`) and the disabled Bhashini mic affordance.
- **Stubs, honestly marked** — `engine/diagnose.ts`, `mocks/index.ts` and
  `db/schema.sql` each carry an explicit `TODO(...)` and do nothing.

### What Codex got right, and should not be redone

- **Zero hardcoded user-facing English in JSX.** Every visible string in all four
  pages and all thirteen components resolves through `resolve()`. This is
  CLAUDE.md §16.4, it is the thing that makes the no-AI honesty claim auditable,
  and the scaffold honours it without exception. This was the single most
  valuable property of the generated code.
- **`MicButton.tsx` matches §9.4 exactly** — `disabled`, `aria-disabled`, a no-op
  handler, no microphone permission request, no speech library imported, and
  Bhashini named in the caption. Nothing to change.
- **Gate state is not conveyed by colour alone** (§11.8) — `RailGate` prints a
  text state label beside the colour.
- **`prefers-reduced-motion` is respected** for the rail marker settle animation
  (§11.5), in `app/globals.css`.
- **The stubs are labelled as stubs.** `engine/diagnose.ts` throws rather than
  returning a plausible wrong answer. Given CLAUDE.md §16.8 — never guess past a
  gap — throwing is the correct failure mode for an unimplemented diagnosis, and
  it is why the gap was impossible to miss during the audit.
- **`README.md` is accurate.** Its "Stubbed" list correctly names the diagnosis
  engine, all seven mock systems, persistence and every external call. Codex did
  not overstate what it had produced.

### What Codex invented that is not in CLAUDE.md

Recorded here because §13.3 of the spec asked for it explicitly. None of these
were fixed in this session; they are findings, not changes.

1. **A second, incompatible blocker taxonomy.** `content/statusCodes.json` maps
   `AADHAAR_NOT_SEEDED`→B2, `LAND_MISMATCH`→B4, `NPCI_UNMAPPED`→B5 and
   `ITD_EXCLUDED`→B6. CLAUDE.md §7.2 assigns those to B4, B5, B4 and B2
   respectively. Its eight code strings are also not the `ReasonCode` set of
   §7.3. Two taxonomies are live in one repo.
2. **An eight-gate Money Rail.** §11.2 specifies seven gates with fixed labels.
   `components/MoneyRail.tsx` inlines an eight-entry `GATE_KEYS` array with
   different labels (`rail.aadhaar`, `rail.exclusion`, `rail.treasury`), and puts
   it in the component rather than the content layer.
3. **A case-ID-first entry screen.** `app/page.tsx` asks for a case ID. §11.7 S2
   specifies Aadhaar / mobile / registration number, precisely because P2 is that
   farmers do not hold a reference number. The generated entry screen inverts the
   product's answer to one of its own stated problems.
4. **An off-spec colour set.** `tailwind.config.ts` defines `ink #202124`,
   `stone`, `alert #B42318`, `rupee #B45309`. None of the eight §11.3 tokens
   exist, and no CSS custom properties are defined at all.
5. **A simplified database schema.** `db/schema.sql` has four tables against
   §8.8's five, and omits `diagnoses`, `grievances`, `consents.scope`,
   `reference`, `sla_due_at` and `ruleset_version`.

### Decisions taken during this session

- **Dense single-line formatting was kept.** Codex emitted most components as one
  long line. It is unusual but consistent across the whole tree, it type-checks,
  and reformatting 17 files two days before a hard deadline is churn with a
  non-zero chance of breakage. Revisit in Stage 2, not now.

---

## Session 2 — 26 August 2026, ~22:00–22:30 — Audit and documentation correction

**Author: Claude (Claude Code).** No feature work. Scope was deliberately limited
to correcting the specification against the tree, executing the rename, and
laying the Tamil plumbing.

### What was found

A file-by-file audit against CLAUDE.md §13.1, which listed as "done — do not
rebuild": seven mock systems, eight personas, fault injection, a deterministic
diagnosis engine, sub-cause derivation, `INDETERMINATE` handling, Fix Paths, a
narrative service and a 28-test suite.

**None of those existed.** The diagnosis engine was a six-line stub that throws.
The seven mock modules all returned `null`. There was one sample case, not eight
personas. There was no fault injection, no `/api/` directory, no test file, and
no test runner.

The inherited §13.1 was not a slightly optimistic list; it described a different
repository. Had it been trusted, the two components CLAUDE.md §8.1 calls "the
product" would have been assumed complete with two build days remaining.

### What was changed

**Documentation only, plus the rename and the Tamil key set.** No feature code
was written and no existing behaviour was altered.

- **CLAUDE.md §9.1 rewritten.** It described a complete, tested narrative service
  at `src/lib/narrative/service.ts` with an `llmAvailable()` guard and a
  `NARRATIVE_MODE` flag. No such file, directory, flag or dependency exists. The
  section now records the service as never built, and notes that this makes the
  honesty claim *stronger*, not weaker: no model can be enabled by setting an
  environment variable, because no code reads one.
- **CLAUDE.md §9.3 re-headed.** Was "Guards already implemented — do not remove
  them"; `numbersAreGrounded()`, `containsSystemJargon()` and `asData()` do not
  exist. Now "SPECIFIED, NOT BUILT", retained as the binding contract if the
  question is ever reopened.
- **CLAUDE.md §9.4 corrected** — `classifyIntentLocal` was marked "already
  built"; it is not in the tree.
- **CLAUDE.md §10.1 rewritten** — replaced the `src/lib/content/verdicts.ts` and
  `fixPaths.ts` paths with the real root-level layout, plus a table mapping each
  planned file to whatever serves its purpose today and naming the gap. `§10.4`
  Fix Paths are recorded as entirely unbuilt.
- **CLAUDE.md §11.2 corrected** — `RAIL_GATES in verdicts.ts` now records that
  the gates are an eight-entry array inlined in `components/MoneyRail.tsx`, and
  that the seven-gate table is the specification the component does not yet meet.
- **CLAUDE.md §13 rewritten entirely** into three audited lists — verified
  present and working, present but stubbed, absent — plus §13.4 on what the audit
  does to the critical path.
- **Rename executed (§1.1).** No `PKH` or `Paisa Kahan Hai` string remained in
  source; `package.json` was already `pm-kisan-nishan`. The outstanding item was
  the case-reference format: `sample-pmk-001` → **`NSH-4F2A`**, matching §12.3,
  across `app/page.tsx`, both catalogues and `data/sample-case.json`.
  `X-NISHAN-Fault` and `NSHDEMO-####` had nothing to rename — no fault middleware
  and no fixtures exist. `npx tsc --noEmit` passes.
- **Tamil plumbing laid.** `content/catalogue.ta.json` created with all 80 keys,
  values `TODO_TA:`-prefixed English. `Locale` widened to `"en" | "hi" | "ta"`,
  the resolver map and the language toggle now accept `ta`.

### Decisions and reversals

- **Reversal — the LLM plan is abandoned, not paused.** §9.1 previously argued
  for keeping a dormant narrative service because "the code is written, tested,
  and costs nothing to leave in place." That premise was false. The section now
  says do not build it. For the video, the line is "there is no language model in
  this build," not "the language model is switched off."
- **Nothing was moved to match the doc.** CLAUDE.md's `src/lib/...` paths were a
  documentation error. The doc was corrected to the tree, not the reverse. Moving
  files two days out would have broken every import for no user-visible gain.
- **Tamil was wired into the visible language toggle.** The alternative was to
  ship the file unreferenced. An unreferenced catalogue proves nothing, and the
  stated purpose of this step was that nothing breaks when Tamil lands — which is
  only demonstrable if the locale is reachable. **Consequence: selecting Tamil
  now shows `TODO_TA:`-prefixed English.** To hide it until the strings are
  written, remove `"ta"` from the array in `components/LanguageToggle.tsx`; the
  type and resolver plumbing stay valid either way.
- **Tamil values were not machine-translated**, by instruction. Four keys are
  exempt from the `TODO_TA:` prefix because they are proper nouns rather than
  prose: `logo.label` (NISHAN) and the three language endonyms
  (`English`, `हिन्दी`, `தமிழ்`).
- **A `language.ta` key was added to all three catalogues.** The toggle resolves
  a `language.<locale>` key per offered locale; without it the resolver would
  have thrown on an undefined template. Key count is therefore 80, not 79.
- **`catalogue.en.json` and `catalogue.hi.json` were reformatted** to one key per
  line while inserting `language.ta`. Content is unchanged. They are now
  hand-editable, which matters because the Tamil values are to be filled by hand.

### Known-bad, deliberately left alone

Flagged, not fixed, because fixing them is feature work and this session was
scoped to documentation:

1. The two incompatible blocker taxonomies (item 1 under Session 1).
2. The missing §12.7 persistent disclosure banner — absent from every screen.
   This is the build's most important honesty control.
3. No footer, so `/whats-real` is reachable only by typing the URL.
4. ~~The project is not a git repository.~~ **Resolved at the end of this
   session** — see "Save point" below.

### Save point

The repository was initialised at the close of session 2 and the whole tree
committed as `6d204ba`, on `main`. Before this there was no version control at
all: no history, no rollback point, two days from a hard deadline, and no way to
satisfy CLAUDE.md §12.9 ("roll back to last known-good deploy") near the
deadline.

- `.gitignore` excludes `node_modules/`, `.next/`, build info, `work/`,
  `outputs/`, all `.env` files except `.env.example`, and the vendored skill
  packages under `.claude/skills/` and `.agents/`. 46 project files are tracked.
- The commit is mixed-authorship and its message says so. **It is a single
  commit, so it does not by itself prove which lines Codex wrote** — CREDITS.md
  remains the authority on that, and is explicit that its attribution rests on
  timestamps and style, not on git history. Every change from here on does have
  verifiable authorship.
- No remote is configured. Deployment (R7) still does not exist.

---

## Session 3 — 27 August 2026 — Palette replacement and rail retokenisation

**Author: Claude (Claude Code).** Design-system work only. No §14 ticket started.

### What changed

- **CLAUDE.md §11.3 replaced in full.** The ink-blue / ledger-paper /
  rubber-stamp palette is withdrawn. Theme is `--teal-deep #00796B`,
  `--green #4CAF50`, `--green-soft #A5D6A7`, `--cyan-pale #E0F7FA`, `--white`;
  functional additions (`--ink`, `--ink-soft`, `--stop`, `--pending`, `--rule`,
  `--focus`) appear only when their one job is on screen.
- **CLAUDE.md §11.4 rewritten** — Anek Latin + IBM Plex Mono, Latin cuts only,
  loaded through `next/font` so they are self-hosted at build time and §11.9's
  zero-third-party budget still holds.
- **§11.2, §11.5, §11.6, §11.7 untouched**, as instructed.
- Tokens defined once in `app/globals.css` as CSS custom properties;
  `tailwind.config.ts` maps names onto them so there is one source of truth.
- All thirteen components and four routes retokenised. `/demo/tokens` added as a
  dev-only surface — **delete before submission**.

### Decisions and reversals

- **Contrast was measured, and the measurements changed the brief.** Three of
  the supplied colour rules do not survive WCAG and were amended in §11.3:
  white-on-`--green` is 2.78:1 (below the 3:1 graphical floor), so the
  passed-gate check is `--ink`; white-on-`--pending` is 3.08:1, so `--pending`
  is a fill carrying `--ink` text and never a text colour; `--rule` on
  `--cyan-pale` is 1.30:1, so hairlines only read on white cards.
- **Scope widened beyond the three rail components, deliberately.** Replacing
  the Tailwind palette deleted the `alert`/`rupee`/`stone` names the rest of the
  tree referenced, which would have rendered those elements colourless. Applying
  tokens everywhere was the smaller change.
- **BlockerCard is no longer red.** It sits on the diagnosis screen alongside the
  blocked rail gate, and §11.3 reserves `--stop` for the blocked gate alone. Two
  red things means the screen has failed, so the card is now neutral.
- **Radius discipline restored.** An earlier mechanical rename had put the 999px
  marker radius on 17 elements. §11.5 reserves it for the money marker; it is now
  used exactly once.

### Flagged, not resolved

1. **§11.1 still says "no green gradients"** and frames green as agriculture
   decoration to be avoided. The theme is now green. §11.1 was in neither the
   update list nor the leave-unchanged list, so it was left alone and the
   contradiction is live in the spec.
2. **`--focus` is the same hex as `--teal-deep`.** The 2px outline offset puts
   the ring on the surrounding background, so it currently reads — but any
   focusable element placed directly on a teal surface will have an invisible
   focus ring.
3. **A "never scrolls away" header** conflicts with the §12.7 persistent banner
   plus a bottom-pinned primary action on a 360px viewport. The header band was
   applied without being made sticky; resolve at NSH-301.

---

## Session 4 — 27 August 2026 — Spec answers, §14 reschedule, E1 (MGSL)

**Author: Claude (Claude Code).**

### Spec decisions applied

- **§11.1** — colour sentence rewritten only. Green is now the theme and is
  described as structural, not agricultural. The ledger metaphor, the ban on
  wheat sheaves, farmer photography, gradients and decoration about farming all
  stand unchanged.
- **§11.3** — added `--focus-on-teal #FFFFFF` and rule 6. `--focus` is the same
  hex as `--teal-deep`, so a teal ring on a teal surface is invisible (1:1).
  Implemented in `app/globals.css` as `.on-teal { --ring: var(--focus-on-teal) }`
  with the ring declared `var(--ring, var(--focus))`, so nesting resolves to the
  nearest surface. Applied to the header band. **Any new teal surface must carry
  `.on-teal`.**
- **§11.8** — fixed-element budget recorded: disclosure banner fixed top,
  primary action fixed bottom, site header scrolls away. Three fixed bands at
  360px is unusable.
- **§12.8** — item 8 added: the refund / voluntary-surrender / revocation
  cluster is deliberately out of scope under R2, named so the omission reads as
  a decision.
- **§14 rewritten** to the E1–E8 then NSH schedule. **§15 also rewritten**,
  because the enumerated cuts turned it from a contingency list into a record of
  decisions; it now carries the decided cuts, what survives of each, and a fresh
  three-step order for 28 August. The previous never-cut set listed "the offline
  recovery moment", which NSH-307's cut contradicts — the entry now says what
  actually survives.

### E1 — Mock Government Systems Layer

| File | What it is |
|---|---|
| `lib/types/systems.ts` | Seven record types with the real §8.4 fields, replacing seven field-less interfaces over a generic PASS/FAIL shape. Adds `SystemResult` and `SystemSnapshot`. |
| `mocks/fault.ts` | `FaultProfile`, the `?fault=` / `X-NISHAN-Fault` grammar, deterministic seeding |
| `mocks/fixtures.ts` | Persona store and identifier lookup. **One persona seeded (Lakshmi, B3)** so E1 is verifiable end to end; the other seven are E2. |
| `mocks/index.ts` | Seven readers plus `readSnapshot`, replacing stubs that returned `null` |
| `app/api/mock/[system]/route.ts` | HTTP surface for the MGSL |
| `tests/mgsl.test.ts` | 17 tests |
| `tsconfig.test.json` | Test build config |

**Decisions**

- **`SystemResult` separates "reachable but holds no record" from "did not
  answer".** This is the load-bearing distinction in the whole layer: §16.8
  forbids guessing past a gap, and the engine cannot honour that if an
  unreachable system and an empty one look the same. E3 depends on it.
- **`failureRate` is seeded, not random.** §8.5 requires same inputs → same
  output, always. A `Math.random()` failure rate would have made the engine
  nondeterministic through the back door. It is now a stable function of
  (system, reference), so a given case plus a given fault always produces the
  same outcome, while still looking random across cases.
- **The engine will call the readers in-process, not over HTTP.** A network hop
  inside a single deployable would spend most of §11.9's 400ms p95 budget on
  itself. The `/api/mock/*` routes exist for the §17 1:00–1:15 shot and to
  trigger faults by URL now that NSH-405 is cut.
- **Test runner: Node built-in, zero new dependencies.** Node 24 strips
  TypeScript natively. Its ESM loader needs explicit file extensions, which this
  repo's Next-style imports do not use, so `npm test` compiles to CommonJS in
  `.test-build/` first. No library was added and the lockfile is unchanged —
  §16.11, and §12.6 on final-day dependencies.
- **Hand-rolled validation, not Zod.** §12.6 asks for Zod at API boundaries.
  Adding a dependency the day before submission is the risk §12.6 itself warns
  about, and the only untrusted inputs here are one enum and one string. Noted
  as a deviation.
- **Deliberate cross-system inconsistency is seeded from the start** (§8.4).
  Lakshmi's land record reads "Lakshmi D." against Aadhaar's "Lakshmi Devi" — a
  benign variance the B5 rule must normalise and correctly decline to flag.

**Known deviation from §12.6:** MGSL endpoints are supposed not to be publicly
routable. In a single Next deployable that cannot be enforced at the network
layer, so the handler applies a same-origin check instead. This is weaker than
§12.6 describes and must be disclosed on `/whats-real` (NSH-406).

**Verified:** `npm test` 17/17 pass · `npx tsc --noEmit` exits 0 · all five app
routes still 200 · live endpoint checks: healthy read 200, timeout 504 after
1.25s, forced 503, header transport 502, unknown system 404, missing ref 400,
cross-origin 403.
