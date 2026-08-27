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

---

## Session 5 — 27 August 2026 — Language decision, disclosure rewrite, E2 (personas)

**Author: Claude (Claude Code).**

### The language decision, and why it is the right one

The selector ships with **every language pmkisan.gov.in offers**. The
translations do not. **English is the only fully resolved locale for Stage 1**;
every other option is selectable, carries a visible *"Coming in the next round"*
label, and keeps the interface in English when chosen.

**Rationale, recorded because it is the interesting part.** A farmer who sees her
language listed and then gets a half-English screen is worse served than one who
sees it listed as coming. The first is a broken promise discovered after she has
committed to the product; the second is information she can act on immediately.
So the selector is honest about its own state — the same principle that governs
`/whats-real`, applied to a component instead of a page.

The corollary is a hard rule: **never render a half-translated screen.** The
existing unused `hi` and `ta` catalogue values stay unwired rather than being
partially resolved.

Spec updated accordingly: §10.2 rewritten, §6.3's language criterion replaced,
and `/whats-real` gains a Languages row. Implementation is queued for the
NSH-302 slot with a 45-minute budget and a plain select fallback if it runs
over — the engine is the critical path.

### §12.2 rewritten, beyond what was asked

The `/whats-real` table claimed SLA clocks, an offline queue, text-to-speech and
a "disabled" AI code path as real or present. After the §15 cuts none of those
exist, and the AI code path never did. Overstating on the one page whose entire
purpose is honesty defeats the page, so the table now lists what actually ships,
including three rows that are unflattering on purpose:

- **Languages — partly shipped.** English resolved, the rest declared pending.
- **API input validation — hand-rolled.** §12.6 specifies Zod; adding a
  dependency the day before submission was judged the larger risk.
- **Mock endpoint isolation — weaker than specified.** §12.6 wants MGSL
  endpoints non-routable. Inside a single deployable that cannot be enforced at
  the network layer, so a same-origin check stands in.

§6.3's "turning off the network loses nothing" was also reduced to what NSH-307's
cut actually leaves.

### E2 — the eight personas

All eight from §8.4 are seeded, covering B1, B2, B3, B4, B5, B6a, B6b and B6c.

**Deliberate inconsistency, in two distinct kinds.** This is the part that
matters, and conflating the two would make the engine dangerous:

- **Benign variance** — "Ramesh P." vs "Ramesh Pandian", "Fathima" vs "Fatima".
  Same person. B5 must normalise these and **not** flag them. A rule that flags a
  spelling variance sends someone to the revenue office for nothing, which costs
  a day's wage and a bus fare.
- **Real mismatch** — Sarala's land is still in her late father's name
  ("Murugesan Kandasamy"); Selvi's in "Ramanathan Perumal". Different people.
  B5 **must** flag these.

Also seeded: a transposed date of birth (Selvi, Aadhaar `1991-03-08` against the
scheme's `1991-08-03` — the ordinary data-entry error), an inactive NPCI mapper
(Ramesh) and a not-found one (Selvi).

**Two personas carry the load for E3:**

- **Selvi R. (P8)** has **four** blockers live at once — registration rejected
  (B1), e-KYC not started with no linked mobile and a transposed DOB (B3), mapper
  not found (B4), land in another name and unseeded (B5). She must return **B1
  alone**. The portal shows her `eKYC Required`, a lower-precedence symptom;
  acting on it would waste a trip, because she is not registered and no
  instalment can be paid regardless. That gap is the product.
- **Anbu K. (P4)** is the **carve-out regression test**. He is a government
  employee *and* Multi-Tasking Staff / Class IV / Group D, who are excluded from
  the exclusion. He must return B6a. If the B2 rule ever drops the carve-out he
  flips to B2 and the suite fails loudly — a wrongly excluded farmer is the most
  expensive error this engine can make.

### Credential-shape guarantee — confirmed

A judge may hit `/api/mock/*` directly, so nothing it returns may resemble a real
credential. Verified two ways:

- **Static** — a test walks every string in every record of every persona and of
  every assembled snapshot, asserting that each 12-digit run is 9999-prefixed,
  each `+91` number uses the unallocated 5-series, each IFSC-shaped token is
  `MOCK`-prefixed and each PAN-shaped token is `MOCKP`-prefixed.
- **Live** — all 8 personas × 7 systems fetched over HTTP (56 responses,
  15.4 KB) and scanned: 16 twelve-digit runs, all 9999; 6 mobiles, all 5-series;
  8 IFSC and 8 PAN tokens, all MOCK. **Zero real-looking credentials.**

The scanner caught one false positive worth recording: `+91` followed by a
10-digit mobile is 12 consecutive digits and matched the Aadhaar rule. The data
was correct; the check was wrong. Dialling codes are now masked before the
Aadhaar scan and validated by their own assertion.

### Fixed

`npx tsc --noEmit` began failing after E2 (TS2802: `matchAll` iteration needs
es2015+, and the app targets es5). Tests are type-checked by
`tsconfig.test.json`, which targets es2022, so `tests` and `.test-build` are now
excluded from the app typecheck. **The app's es5 target is unchanged** — app code
and test code simply have different contracts, which is correct.

**Verified:** `npm test` 39/39 · `npx tsc --noEmit` exits 0 · all five app routes
200 · live credential scan clean.

---

## Session 6 — 27 August 2026 — E3, the diagnosis engine

**Author: Claude (Claude Code).** Pushed the two outstanding commits first;
`main` is in sync with origin.

### What was built

| File | What |
|---|---|
| `lib/types/diagnosis.ts` | The §8.5 contract: `BlockerCode`, `ReasonCode`, `Evidence`, `Diagnosis`, `RULESET_VERSION` |
| `engine/names.ts` | Name comparison for B5 |
| `engine/rules.ts` | The six gate rules, each declaring the systems it needs |
| `engine/diagnose.ts` | Orchestration, INDETERMINATE, facts, observations |
| `tests/engine.test.ts` | 29 tests |

`engine/diagnose.ts` previously threw. It now implements
`diagnose(snapshot, { cycle, now }) → Diagnosis`.

### Every persona returns its expected verdict

| Persona | Blocker | ReasonCode | Also live | Portal shows |
|---|---|---|---|---|
| Lakshmi D. | B3 | `MOBILE_NOT_LINKED` | — | eKYC Required |
| Ramesh P. | B4 | `MAPPER_INACTIVE` | — | Aadhaar Seeding Status: No |
| Sarala M. | B5 | `LAND_NAME_MISMATCH` | — | Stopped by State |
| Anbu K. | B6a | `FTO_IN_QUEUE` | — | FTO Generated, Payment Under Process |
| Fatima B. | B6b | `ACCOUNT_DORMANT` | — | Rejected by Bank |
| Govindan S. | B6c | `CREDITED` | — | Payment Success |
| Murugan V. | B2 | `INCOME_TAX_PAYER` | B5 | Stopped by State |
| Selvi R. | B1 | `REGISTRATION_REJECTED` | B2, B3, B4, B5 | eKYC Required |

**Selvi has five live blockers, not four.** E2 seeded B1, B3, B4 and B5
deliberately; her land was also acquired after the 2019-02-01 cut-off, so B2
fires too. She still returns B1 alone. The extra gate makes her a stronger
precedence test than intended, and it is recorded here so the count is not a
surprise later.

**Murugan carries a secondary B5** because his portal status is
`Stopped by State`, which the B5 rule reads as `STATE_HOLD`. That is correct and
causally right: the state paused him *because* of the tax flag. B2 wins, B5 is
noted for the officer.

### Decisions

- **Two kinds of "no answer" are kept apart, and that is what makes §16.8
  enforceable.** Each rule declares `requires: SystemCode[]`. Before a gate is
  judged, the orchestrator checks those systems actually answered; if any did
  not, it returns INDETERMINATE and does **not** descend. Ramesh is genuinely
  B4, but with `mUIDAI` silenced the engine returns B0 rather than the blocker
  it could still see — because it cannot rule out B3, and a farmer sent to the
  bank for an identity problem loses a day's wage. E1's `SystemResult` split is
  what makes this checkable rather than aspirational.
- **INDETERMINATE reports what is already known**, per §7.2 B0. Silence `mNPCI`
  for Ramesh and the verdict names "B1, B2 confirmed clear" alongside the system
  that did not answer.
- **A silent system that was only needed lower down does not weaken the
  verdict.** Lakshmi with `mNPCI` down is still B3, still `certain`, with
  `mNPCI` listed in `unreachableSystems`. Honesty about a gap is not the same as
  doubt about an answer.
- **B5's name rule turns on one guard: the leading given name must be
  compatible.** Both failure modes are expensive and pull in opposite
  directions — too strict and "Ramesh P." is flagged against "Ramesh Pandian",
  costing a wasted trip; too loose and "Murugesan Kandasamy" passes as "Sarala
  Murugesan", so the real blocker is missed and she waits for money that will
  never come. Sharing a surname is not sharing an identity: land held by a
  father and claimed by a daughter shares "Murugesan" and is still a different
  person. Transliteration folding (th→t, ksh→x, doubled letters) handles
  Fathima/Fatima and Lakshmi/Laxmi; initial expansion handles "Ramesh P.".
- **`secondaryObservations` never touch the verdict.** Gathered after the
  primary is decided, only from systems that answered. B6a is excluded — "not
  yet queued" is trivially true for anything blocked earlier, so listing it
  would be noise; B6b and B6c are kept because a returned payment or an existing
  credit deserves an officer's attention.
- **No date is predicted.** §9.2 forbids predicting a payment date not derived
  from mock system data. The B6a expected-by is `released_on + 7 days`, read
  from `mSCHEME`, and it is parsed back out of the evidence the rule already
  produced rather than computed twice.
- **Evidence is farmer-facing, so §16.5 applies to it.** S5 renders it, so field
  labels are plain language ("Aadhaar linked to a bank account"), never column
  names. A test asserts `npci|fto|mapper|seeding|seeded|dbt|pfms|rft` appear
  nowhere in any evidence field or note, on the INDETERMINATE path included.
  Officer-facing precision belongs in the Visit Slip at E7.
- **Determinism is asserted, not assumed.** Every persona is diagnosed twice and
  deep-compared; `evaluatedAt` comes from the injected `now`; there is no
  `Date.now()` in the path and no model of any kind (§16.2).

### Flagged for E6, not fixed

**The B6a expected-by date is already in the past.** Anbu's instalment released
2026-06-20, so the derived expected-by is 2026-06-27 — two months before the
demo date. Telling a farmer in August that her money is "expected by 27 June" is
nonsense.

The fixture is not wrong; the two-month gap **is** the story, and §3.6 puts
simple issues at 7-10 working days. The fix belongs in content: §10.5 requires
that "every wait states what happens when it ends and what happens if it does
not", so the B6a copy needs an overdue variant rather than a bare date. Raised
here so E6 handles it deliberately.

### Known conflict, unchanged

`lib/types/blocker.ts` and `content/statusCodes.json` still carry the older,
incompatible taxonomy that the case screen reads (§13.2). `lib/types/diagnosis.ts`
is now the authority. E4 reconciles them.

**Verified:** `npm test` 68/68 (29 new) · `npx tsc --noEmit` exits 0 · all five
app routes and `/api/mock/*` return 200.

---

## Session 7 — 27 August 2026 — E4, taxonomy reconciliation

**Author: Claude (Claude Code).**

### One taxonomy

Deleted outright:

| File | Why |
|---|---|
| `lib/types/blocker.ts` | `Blocker`/`Verdict`/`Precedence` — a three-field verdict superseded by the ten-field `Diagnosis` |
| `engine/precedence.ts` | Duplicated `PRECEDENCE`; rule order now lives in `RULES` in `engine/rules.ts`, where it is actually consumed |
| `content/statusCodes.json` | The invented taxonomy — `FTO_REJECTED`, `NPCI_UNMAPPED`, and blocker numbers that contradicted §7.2 |

`lib/types/case.ts` now carries a full `Diagnosis` and the §8.6 state set (13
states, with the seven reachable in Stage 1 marked; the grievance and escalation
states are defined because the process has that shape even though NSH-401/402/403
are cut). `lib/types/diagnosis.ts` is the sole authority.

Also removed from all three catalogues: every `cause.*` and `action.*` key. Their
names encoded the deleted numbering — `cause.b2.aadhaar_not_seeded` called
Aadhaar seeding B2 where §7.2 says B4 — so keeping them would have kept the
second taxonomy alive in the content layer. `owner.*` keys were kept; authority
labels are reusable. Catalogues went 64 → 64 keys across en/hi/ta, still
identical sets.

Four tests now stop the second taxonomy growing back: the three deleted files
must not exist, no invented code string may appear in any catalogue, and no key
may match `^(cause|action)\.b\d`.

### Real portal vocabulary

`PortalStatusString` is exactly the seven strings a farmer will have seen, and
tests assert every persona carries one of them **and** that none of them appears
in any farmer-facing catalogue value. They belong in `portalStatus`, rendered as
mono secondary text on S4 so she can match what the official site told her.

`StatusCodeChip` was rewritten to render that string and nothing else. This is
the one place system vocabulary is allowed on a farmer-facing screen: "FTO
Generated, Payment Under Process" is the government's own wording, quoted.
**§16.5 governs what we write, not what we quote.**

### The Money Rail now runs on §11.2

The eight ad-hoc gates are gone. `RAIL_GATES` and `stoppedAt()` live in
`lib/types/diagnosis.ts` with §11.2's seven gates and exact labels, and
`data/sample-case.json` is generated from a real engine verdict rather than
hand-written.

`stoppedAt` encodes the deliberate inversion: **B5 maps to an earlier gate than
B4**, because B4 is *judged* first (an unpayable account is more actionable) but
the money physically stops at the state gate earlier in the pipeline. A test
asserts `stoppedAt("B5") < stoppedAt("B4")` so that inversion cannot be
"corrected" by someone tidying up later. This makes NSH-304 pure wiring.

### A real defect the coverage probe exposed

`readSystem` was returning the fixture object **by reference**. Any caller that
mutated a snapshot corrupted the shared persona store for the life of the
process, and every later read silently returned different data.

The E3 carve-out test was doing exactly that — permanently flipping Anbu's
`is_mts_class_iv_group_d` — and passing only because declaration order put the
persona assertions first. It was luck, not correctness.

`readSystem` now returns a `structuredClone`. Two tests lock it: mutating a
result cannot change a later read, and two reads return distinct objects with
identical values. This matters beyond tidiness — §8.5 requires determinism, and
shared mutable fixtures break it invisibly, which is the worst way to break it.

### ReasonCode coverage — E6's true surface area

All **27** ReasonCodes in §7.3, probed by constructing targeted snapshots:

- **9 are demonstrated by a persona** — one per blocker, plus `SYSTEM_UNREACHABLE`
  via fault injection.
- **18 are reachable** but not demoed.
- **0 are unreachable.**

`GENDER_MISMATCH` was the one dead code: `SchemeRecord` had no gender to compare
against Aadhaar's. Added `gender_on_record` and the B3 branch, mirroring
`DOB_MISMATCH`. Leaving a specified sub-cause structurally unreachable would have
meant §7.3 was partly fiction.

**E6 therefore authors 27 verdicts, not 9.** The nine demoed ones carry the demo;
the other eighteen still need a sentence, because the engine can emit them.

### Flagged for E6

**Evidence carries English authored in `engine/rules.ts`, not in the catalogue.**
§10 requires every user-facing string to come from a keyed content table, and S5
renders evidence. So the case screen currently shows the rail and the portal
string but **not** the verdict sentence or the evidence table — rendering them
would put non-catalogue prose on the primary path, which §16.4 forbids and which
is the claim the whole build rests on.

E6 has to decide: move the notes into catalogue keys, or reduce `Evidence` to
codes and values and render the words from the content layer. The second is
cleaner and is what §10 implies. Until then the case screen is deliberately thin.

**Verified:** `npm test` 87/87 · `npx tsc --noEmit` exits 0 · all five app routes
and `/api/mock/*` return 200 · the case page renders all seven §11.2 gates in
order with the portal string beneath.
