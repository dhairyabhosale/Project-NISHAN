# NISHAN - Stage 2 Diagnostic Audit

**Date:** 2 September 2026
**Audited commit:** `c9def37` (tip of `origin/main`, 28 Aug 2026 23:54 IST)
**Production URL:** https://project-nishan.vercel.app/ - live, HTTP 200, serving `c9def37`
**Method:** read-only. Nothing in the repository was changed. `origin/main` was
extracted to a scratch directory and built there; the working tree was not touched.

> **Read this pessimistically.** Where a thing half-works it is written up as
> broken. Where I could not verify something I say so.

---

## PART 0 - DEPLOYMENT INTEGRITY

### The premise in the brief is wrong, but there is a real problem underneath it

> **Production is NOT stale, and it is NOT the Codex scaffold. Production is
> current with `origin/main`. What is stale is the LOCAL WORKING COPY, which is
> 20 commits behind origin.**

Every other finding in this audit is therefore about code a judge *can* see.

| Check | Result |
|---|---|
| `GET /` | `200`, `Content-Length: 37597`, `X-Vercel-Cache: HIT` |
| Page title | `NISHAN - PM-KISAN services` |
| Content served | Current build: How It Works route, loading splash, 8 stat cards, illustrative voices, four tap choices |
| Case-ID entry field on `/` | **Absent.** The entry screen is the four-choice version, as specified |
| Build ID served | `CWJwp47Gx-9QbWdEFb_YO` |
| `Age: 414647` s | approx 4.8 days, so generated approx 28 Aug 18:35 UTC = 29 Aug 00:05 IST, minutes after `c9def37` (28 Aug 23:54 IST) |

**Conclusion: production is the tip of `origin/main`.** The `Age` header is a
correctly-cached static page, not a stale deployment.

### Git state - this is the real Part 0 finding

```
local HEAD  : 6cf699e  (28 Aug 09:32)
origin/main : c9def37  (28 Aug 23:54)
git rev-list --left-right --count origin/main...HEAD  ->  20  0
```

The local checkout is **20 commits behind** `origin/main` and has **0** commits
origin does not have. Those 20 commits (`3084bee`..`c9def37`) are header spacing
work, demo layout, the loading animation, and the How It Works page.

**Why this matters more than it looks:** the two most damaging defects in this
report (**F1** the no-JS blank screen, **F2** the 2-second splash) were both
introduced in that 20-commit window, *after* the last commit present locally. Any
audit run against the local tree would have missed both. Reconcile the checkout
before any Stage 2 work begins, or the same blind spot repeats.

### Build results (run against `origin/main`)

| Command | Result |
|---|---|
| `npm test` | **156 pass, 0 fail**, 31 suites, 6.2 s |
| `npx tsc --noEmit` | **clean**, exit 0 |
| `npx next build` | **succeeds.** 18 routes, 16 static pages generated |

No failed Vercel build was observable: I have no Vercel dashboard access, so
**deployment history is unverified**. The evidence that the last build succeeded is
indirect but strong - production serves content that only exists in `c9def37`.

### First Load JS - all routes inside the 150 kB budget (§11.9)

```
/                     116 kB     /how-it-works         115 kB
/case/[id]            117 kB     /services             115 kB
/case/[id]/fix        118 kB  <- largest
/case/[id]/fix/slip   117 kB     /whats-real           106 kB
/who                  106 kB     /contact              106 kB
/demo                 115 kB     shared by all        87.3 kB
```

---

## PART 1 - ROUTE AND FUNCTIONALITY INVENTORY

### Every route, checked on production

| Route | Status | Works? | Reachable by navigation? |
|---|---|---|---|
| `/` | 200 | Yes | Entry point |
| `/who` | 200 | Yes | Header, hero CTA, 4 tap choices |
| `/who/verify` | 200 | Yes, **client-only** (see F6) | Only after a successful lookup |
| `/case/[id]` | 200 | Yes, all 8 personas | `/who`, `/demo` |
| `/case/[id]/fix` | 200 | Yes | "Fix this" on the case screen |
| `/case/[id]/fix/slip` | 200 | Yes, print CSS correct | "Print this slip" |
| `/services` | 200 | Yes | Header, footer, landing |
| `/faq` | 200 | Yes | Header (Help), footer |
| `/contact` | 200 | Yes | Header (Help), footer |
| `/how-it-works` | 200 | Yes | Header, footer |
| `/whats-real` | 200 | Renders **one broken row** (F8) | Header, footer |
| `/demo` | 200 | Yes | Header, hero secondary CTA |
| `/demo/new` | 200 | Yes | `/demo` |
| `/api/lookup` | 405 on GET, 200 on POST | Yes | - |
| `/api/demo-case` | 405 on GET | Yes | - |
| `/api/mock/[system]` | 200 / 400 / 403 | Yes | - |

**No dead links.** All 23 internal hrefs found across nine rendered pages
(including the three header dropdowns) return 200. One external link:
`https://pmkisan.gov.in/` in `app/services/page.tsx:22`, used as an `href`, never
fetched.

### All eight personas, end to end through the UI on production

Every one returns its expected verdict. This is the strongest part of the build.

| Ref | Persona | Blocker | Verdict rendered on `/case/:ref` |
|---|---|---|---|
| `NSH-D33F` | Lakshmi D. | B3 | "Your identity check is not finished, and the phone number on your Aadhaar cannot receive the code." |
| `NSH-B676` | Ramesh P. | B4 | "Your bank has not linked your Aadhaar to your account, so the money has nowhere to land." |
| `NSH-3DCE` | Sarala M. | B5 | "Your land record is in a different name from your Aadhaar, so your state has paused your payment." |
| `NSH-7057` | Anbu K. | B6a | "Your payment passed every check and was queued for release..." |
| `NSH-CE4A` | Fatima B. | B6b | "Your bank returned the money because your account has gone dormant." |
| `NSH-3D44` | Govindan S. | B6c | "This instalment is not missing. It reached your account on 2026-06-24..." |
| `NSH-1545` | Murugan V. | B2 | "Your record is marked as an income tax payer for 2025-26..." |
| `NSH-7CF2` | Selvi R. | B1 | "Your application was not accepted... Land ownership not verified" |

Selvi R. correctly returns **B1 alone** although four blockers are live on her
record - precedence works in production, not just in tests.

### Fault injection and INDETERMINATE - works, and is defensible

| URL | Result | Correct? |
|---|---|---|
| `?fault=mNPCI:timeout` on B4 | INDETERMINATE | Yes - `mNPCI` is required to decide B4 |
| `?fault=mUIDAI:down` on B4 | INDETERMINATE | Yes - needed to rule out B3 (higher precedence) |
| `?fault=mSCHEME:timeout` on B4 | INDETERMINATE | Yes - needed to rule out B1 |
| `?fault=mLAND:timeout` on B4 | INDETERMINATE | Yes - B2's `LAND_ACQUIRED_AFTER_CUTOFF` needs `mLAND` (`engine/rules.ts:116`) |
| `?fault=mBANK:down` on B4 | **B4 still returned** | Yes - `mBANK` only affects B6, lower precedence |
| `?fault=slow` | 2.91 s vs 0.44 s baseline | Latency injection works |

§16.8 ("never guess past a gap") is **structurally enforced**, not aspirational:
each rule declares `requires: SystemCode[]` and the orchestrator refuses to
descend past a silent dependency. The INDETERMINATE copy is the best writing in
the product: *"We could show you a likely answer, but a wrong one would send you
to the wrong office and cost you a day's wage."*

### Journey walk as a first-time user - where I got stuck

1. **First load is a blank pale screen with a small square for 2-8 seconds.**
   No text, no brand name, no explanation. On throttled 2G it was 8.4 s. See **F1/F2**.
2. `/` then "My instalment did not come" then `/who`. Clean. Three tabs, no captcha, no login.
3. On `/who`, the demo-persona cards below the form show raw blocker codes -
   **"B3", "B4", "B5"** - and the phrase **"B4 mapper inactive"**. A farmer reading
   this sees exactly the jargon the product exists to abolish. See **F5**.
4. `/who/verify` renders **nothing** without JavaScript, and nothing server-side
   at all. See **F6**.
5. `/case/:ref` is good. Verdict above the rail, one red gate, evidence table,
   raw portal string in mono. **But the primary action "Fix this" is not on
   screen** - it sits 2,297 px down a 3,395 px page. See **F3**.
6. `/fix` is the second-best screen in the build. The ruled-out route
   ("A code will not reach you. No phone number is linked to your Aadhaar...")
   is the product's signature insight, and it ships.
7. `/fix/slip` is the best artifact in the build. Print CSS hides header, footer
   and the Bhashini widget; the officer request is fully slot-filled:
   *"Please correct the owner name on khata KH-40552 from 'Murugesan Kandasamy'
   to 'Sarala Murugesan' as per Aadhaar."*

### Language selector

Lists 14 languages with endonym plus English name. `English`, `हिन्दी`, `मराठी`
carry no "coming" label; the other 11 are labelled **"Coming in the next round"**,
Tamil included. **No `TODO_` string reaches the screen on any route** (checked on
15 routes at 2 viewports).

Hindi genuinely resolves - 909 Devanagari characters on the case screen, 832 on
`/fix` after client-side navigation. **But see F4:** the choice is lost on every
full page load, and `<html lang>` never changes.

### Behaviour when JavaScript is slow or fails

Catastrophic. See **F1**. With JS disabled every route is a blank
`--cyan-pale` screen. Server-rendered content exists underneath and is unreachable.

### Print view

Correct. `header` hidden, `footer` hidden, Bhashini widget hidden, the
"Prototype" badge deliberately retained, disclaimer present.

---

## PART 2 - SPEC CONFORMANCE

### §16 rules, one by one

| # | Rule | Verdict | Evidence |
|---|---|---|---|
| 16.1 | This document is authoritative | **Honoured** | CLAUDE.md §13 was rewritten from a file audit; contradictions flagged not silently fixed |
| 16.2 | No LLM in the diagnosis path, ever | **Honoured** | `package.json` deps are `next`, `react`, `react-dom` only. No model SDK, no `process.env` read in app code, no `.env` file. Only two `fetch()` calls exist, both same-origin (`app/who/IdentifyForm.tsx:54`, `app/demo/new/NewDemoForm.tsx:39`) |
| 16.3 | No chatbot, no chat widget | **At risk** | `components/BhashiniWidget.tsx` is a fixed bottom-right pill that opens a panel - the exact form factor of a chat launcher. It holds no conversation and says "Coming soon", so the letter is kept; the silhouette is the incumbent's. See F13 |
| 16.4 | Zero hardcoded user-facing strings in JSX | **VIOLATED** | `app/demo/PersonaPicker.tsx:122-125,175`; `components/NishanLoader.tsx:34,38`; `mocks/fixtures.ts:99` (rendered via `demonstrates`) |
| 16.5 | No system vocabulary in farmer-facing copy | **VIOLATED** | `mocks/fixtures.ts:99` renders **"mapper"** on `/who` and `/demo`. The four banned-word tests scan catalogues only, never fixtures or JSX |
| 16.6 | Never contact a live government system | **Honoured** | `pmkisan.gov.in` appears once, as an `href` (`app/services/page.tsx:22`). No fetch to any external host anywhere |
| 16.7 | No real personal data | **Honoured** | `tests/personas.test.ts:160-216` walks every string of every record and asserts synthetic shape for Aadhaar, mobile, IFSC, PAN, account and registration |
| 16.8 | Never guess past a gap | **Honoured, and enforced structurally** | `engine/rules.ts` `requires:` plus `engine/diagnose.ts:128-135`. Verified live with five fault profiles |
| 16.9 | `RESOLVED_CREDITED` is the only success terminal | **Honoured in types, unexercised** | `lib/store.ts:88`, `lib/types/case.ts:34`. No grievance exists, so `CLOSED_UNRESOLVED` is never reachable |
| 16.10 | Every mutating action idempotent | **Honoured for what exists** | `lib/store.ts:143-146` - duplicate key is a no-op. There is no outbox (cut per §15) |
| 16.11 | No component/state library, ORM, dark mode, auth, third-party script | **Honoured** | Three runtime dependencies total |
| 16.12 | No features outside §14 | **Violated by decision, not by accident** | `/services`, `/faq`, `/contact`, `/how-it-works`, `/demo/new`, the loading splash and the testimonials are all outside §14. The user changed the objective on 28 Aug; CLAUDE.md was never updated to match. See F14 |
| 16.13 | Run the test suite after every substantial change | **Unverifiable** | 156 tests pass now; I cannot see whether they were run per commit |
| 16.14 | Keep BUILDLOG and CREDITS current | **VIOLATED** | BUILDLOG ends at "Session 11". Zero mentions of `NishanLoader`, the loading screen, `how-it-works`, or the 20 commits from 28 Aug 10:09-23:54. That is 50% of the judged video's second minute (R1) |
| 16.15 | Cut in §15 order when short | **Honoured** | Cuts match §15 and are disclosed on `/whats-real` |

### Specific checks requested

- **More than one `--stop` per screen (§11.3):** **Compliant.** The case screen
  paints `#C62828` on 7 DOM nodes, but they are one visual object - the blocked
  gate: marker dot, gate card border, icon span, its `<svg>`, two `<path>`s, and
  the "Stopped here" label. No other screen paints `--stop` at all except `/demo`
  (1 node). One red thing per screen, as specified.
- **Non-synthetic identifiers:** none found, in fixtures, tests, docs or the live
  `/api/mock/*` response.

### `/whats-real`, row by row against what ships

The page is genuinely good and mostly accurate. It is deliberately unflattering
in the right places. Problems:

| Row | Claim | Reality | Verdict |
|---|---|---|---|
| Diagnosis engine - Real | Deterministic, B1 to B6, evidence-carrying, no model | True, verified live | **Accurate** |
| Mock systems and faults - Real | Seven independently failing systems | True | **Accurate** |
| Case create/read/event log - Real | "log lives in server memory only, so it does not survive a restart" | True and admirably blunt | **Accurate** |
| AI / language model - Not used | "no model library, no key is read, no request leaves the app" | True | **Accurate** |
| **Languages - Partly shipped** | "English, Hindi and Marathi are fully resolved" | Catalogues resolve, but **the selection is discarded on every page load** and `<html lang>` never leaves `en` | **Overstated - F4** |
| Input checking - Hand-written | "Same coverage, less machinery" | Malformed JSON and type-confusion payloads both return `BAD_REQUEST` | **Accurate** |
| **Mock endpoint isolation - Weaker than specified** | "they apply a same-origin check instead" | A foreign `Origin` gets `403 CROSS_ORIGIN_BLOCKED`, but **a request with no `Origin` header at all returns 200 and the full record.** Any curl or server-side fetch walks straight in | **Understated - F11.** Impact is nil (data is synthetic) but the wording implies more than the check does |
| Simulated rows (Aadhaar, payment/bank/land/tax, OTP, people) | - | All true | **Accurate** |
| **Fix path progress - Real, on your device** | "survives a reload" | **True.** Ticking step 1 writes `nishan:fix:NSH-D33F` to `localStorage`; after reload the screen reads "Step 1 of 3 saved on your phone" | **Accurate** |
| Offline queue - Not built | Cut | True | **Accurate** |
| Complaint filing / clocks / escalation - Not built | Cut | True | **Accurate** |
| Case timeline - Not built | "Events are recorded but not shown" | True | **Accurate** |
| **Read aloud - Available** | Browser speech synthesis | **True.** `speechSynthesis.speak()` fires with the verdict text and `lang=en-IN` | **Accurate** |
| Voice input - Planned | Button visible, disabled, no permission | True | **Accurate** |
| In-browser face check - Planned | Described, not shipped | True | **Accurate** |
| **Row 19** | - | **Renders as three bare hyphens.** `STATUSES` has 19 entries, the catalogue has 18 rows (0-17), so `real.row.18.*` resolves to `MISSING_SLOT` | **BROKEN - F8** |
| "Your case" section | "Nothing about you is stored on our side beyond this browser session" | True, but §12.2 and §12.5 require a **"Delete this case" control**, and there is none - only prose | **Missing control - F12** |
| Known limitations - "Three languages are complete" | - | Consistent with the Languages row, but contradicted by CLAUDE.md §10.2 which still says English only. The **doc** is stale here, not the build | **Doc drift - F14** |

---

## PART 3 - DESIGN AND UX

Assessed at 375 x 812 and 1440 x 900 on production, full-page and viewport.

### Token conformance - the palette is used, but two colours do 90% of the work

Painted-background census by area, desktop:

| Route | cyan-pale | white/paper | teal-deep | green-soft |
|---|---|---|---|---|
| `/` | 74% | 19% | 6% | - |
| `/case/:ref` | 77% | 19% | 3% | 1% |
| `/case/:ref` (B6c credited) | 76% | 14% | 3% | 7% |
| `/contact` | 68% | 26% | 5% | 0% |

`--green` (`#4CAF50`) barely registers as a painted surface anywhere.
`--stop` and `--pending` appear at approx 0% by area, which is correct - they are
single-purpose. **It is not "mostly white": it is mostly pale cyan.** A screenshot
reads as two colours plus a teal header, not the five §11.3 describes.

### Desktop layout - the "narrow centred column" problem is already fixed

`main` measures **1152 px** on interior routes and **1440 px** (full-bleed bands)
on `/`, `/services`, `/faq`, `/contact`. Content is centred with approx 144 px
gutters. This reads as a designed page, not a phone stretched wide.
**No finding here.**

### The Money Rail - functional and clear, but not yet the portfolio piece

What works: verdict above the rail in the largest type; exactly one shut gate in
`--stop`; the money marker is the only 999 px radius on screen and carries
"₹2,000 stopped here"; passed gates carry a check **and** the word "Passed", so
state survives without colour (§11.8); unreached gates are dashed outlines; the
raw portal string sits alongside in mono.

What holds it back:

- The gates are large rounded rectangles in a vertical list. It reads as a
  **checklist**, not the "transit record / chain of custody" §11.2 describes.
  The connecting line is present but visually subordinate to the boxes.
- The four "Not reached" gates are the same size as the meaningful ones and carry
  two words each. They consume roughly half the rail's height saying nothing.
- On desktop the rail sits in the left column and the evidence cards in the right,
  and the right column ends well before the rail does, leaving a large empty
  well at the bottom right.
- `--ink-soft` on `--green-soft` for the "Passed" labels measures **3.58:1** -
  fails §11.9's 7:1 body requirement and even AA for normal text.

### Motion

- `prefers-reduced-motion: reduce` gives **0 running animations.** Correctly honoured.
- Normal: `stat-lift` runs on 8 stat cards, 16 s, infinite. Subtle, acceptable.
- The rail marker settle is present.
- **`.page-in` is the cause of F3** - see below.

### Specific visual defects

**The hero backdrop reads as a rendering glitch.** `components/FieldBackdrop.tsx`
draws 7-10 full-width `<rect>` bands at 16% opacity with
`preserveAspectRatio="none"` (lines 79-95). Stretched across a 1440 px hero these
are not furrows or terraces - they are **horizontal stripes across the headline**,
and they look like a broken gradient or a screenshot artifact. Confirmed on a
viewport-only capture, so it is not a stitching artifact. The same component runs
behind "About the scheme" with `text-teal-deep`, striping that section too.

**Body copy on `--teal-deep`.** The hero standfirst is white body text on teal =
**5.32:1**, under the 7:1 body floor. §11.3 rule 2 forbids exactly this.

### Empty, error and loading states

| State | Exists? |
|---|---|
| Empty - unknown case reference | **Yes.** `app/case/[id]/CaseNotFound.tsx` - heading plus a route back to `/who`. Thin (no explanation of *why*), but present and localised |
| Loading | **Yes** - `app/loading.tsx`, and it is the problem, not the solution (F2) |
| **Error boundary** | **NO.** There is no `error.tsx`, no `not-found.tsx`, no `global-error.tsx` anywhere in `app/`. Any unhandled server error renders Next.js's default black-on-white English error page - off-brand, unlocalised, and it will read as "broken" to a judge |
| Offline / connection strip | `components/ConnectionStrip.tsx` exists |

### Touch targets (§11.5: 56 px primary, 48 px everything else)

Measured at 375 px. Systematic shortfall:

| Element | Height | Required |
|---|---|---|
| All 8 footer links | 40 px | 48 |
| Logo link | 36 px | 48 |
| "Listen" button (on 4 screens) | 40 px | 48 |
| `<summary>` "Do not have this?" | 21 px | 48 |
| `<summary>` "Did not get the code?" | 28 px | 48 |
| `/demo` filter buttons (6) | 40 px | 48 |
| `/demo/new` radio inputs (8) | 20 px | 48 (labels are larger and clickable, so this one is cosmetic) |

Primary actions and the four tap choices **do** meet the floor.

---

## PART 4 - CODE HEALTH

### Results

`npm test` **156 pass / 0 fail**. `npx tsc --noEmit` **clean**. `npx next build`
**succeeds**.

### Coverage by layer

| Layer | Covered? | Notes |
|---|---|---|
| `engine/` | **Yes** - 30 tests | `rules.ts`, `format.ts` covered transitively via `diagnose` |
| `mocks/` | **Yes** - 41 tests | fixtures, fault injection, credential shapes |
| `content/` | **Yes** - 85 tests | slot filling, catalogue parity, banned vocabulary, portal strings |
| `lib/store.ts` | **NO** | `referenceFor`, `gatesFor`, `openCase`, `openCustomCase`, the event log - the entire case layer, zero direct or transitive coverage |
| `lib/demoCase.ts` | **NO** | encode/decode of user-created demo links |
| `lib/languages.ts` | **NO** | - |
| `app/**` (18 routes, 3 API handlers) | **NO** | |
| `components/**` (17 components) | **NO** | |

`tsconfig.test.json:23` excludes `app` and `components` outright. That exclusion
is a reasonable build-time decision, but it is **the direct cause of three
findings in this report**: F8 (the 19-vs-18 row bug), F5 (the `mapper` string
reaching a screen), and F4 (locale not persisted). None of them could ever fail a
test as the suite is scoped today.

### Tests passing for the wrong reason / order dependence

I ran each file in isolation:

```
content.test.js   68 pass    personas.test.js  22 pass
engine.test.js    30 pass    taxonomy.test.js  17 pass
mgsl.test.js      19 pass                      = 156, matches the full run
```

**No order dependence.** The `structuredClone` fix in `mocks/index.ts` is holding.

One systemic weakness worth naming: the four banned-vocabulary tests
(`tests/content.test.ts:180`, `:312`, `tests/engine.test.ts:205`,
`tests/taxonomy.test.ts:84`) all assert against **catalogue JSON only**. They pass
while `mocks/fixtures.ts:99` ships the word "mapper" to a user-facing screen. The
test proves less than its name suggests.

### Dead code and orphans

- `db/schema.sql` - **never referenced by any code**. No driver, no connection,
  no migration runner. A spec artifact that reads like an implementation.
- `components/FieldBackdrop.tsx:29` - `PHOTOS[]` is permanently empty; the
  `<img>` branch (lines 49-59) is unreachable dead code with a `TODO(decide)`.
- No unreferenced files in `components/`, `lib/`, `engine/`, `content/`, `mocks/`.
- No competing implementations found. The second blocker taxonomy
  (`lib/types/blocker.ts`, `engine/precedence.ts`, `content/statusCodes.json`) is
  gone and `tests/taxonomy.test.ts:31-36` actively keeps it deleted.

### Dependencies

`next`, `react`, `react-dom`. Seven dev dependencies. **Nothing unused, nothing
risky, no lockfile drift.** This is exemplary and should be said out loud in the
video - three runtime dependencies for a build of this size is a real result.

### Accessibility - axe-core on 15 routes at 2 viewports

| Impact | Rule | Nodes | Reach |
|---|---|---|---|
| **Serious** | `color-contrast` | 56 | **all 30 route-views** |
| Moderate | `page-has-heading-one` | 2 | `/case/:ref/fix/slip` at both viewports |

No critical violations. The contrast failures are two distinct causes:

1. **The "Prototype" badge** - `--pending` `#EF6C00` as **text** on white =
   **3.08:1**, on every page. CLAUDE.md §11.3 rule 3 names this exact pair and
   this exact ratio as forbidden: *"`--pending` is a fill, never a text colour."*
2. **Rail "Passed" labels** - `--ink-soft` on `--green-soft` = **3.58:1**.

Also failing but not flagged by axe (it passes AA, fails the project's own AAA bar):
white body copy on `--teal-deep` = 5.32:1 in the hero.

Other a11y notes: `<html lang="en">` is hardcoded at `app/layout.tsx:20` and never
updates (§11.8 violation). `components/NishanLoader.tsx` announces "Loading NISHAN"
twice - once via `aria-label` (line 34) and once via an `sr-only` span (line 38).

### Performance - measured on production with CDP throttling, 375 px

| Profile | FCP | Time until the splash clears and the page is usable | Transfer |
|---|---|---|---|
| Fast 3G (1.6 Mbps, 150 ms) | **964 ms** (budget: under 2 s) | **4,001 ms** | approx 108 kB, 20 requests |
| Slow 3G / 2G (400 kbps, 400 ms) | **2,412 ms** (over budget) | **8,413 ms** | approx 108 kB, 20 requests |

FCP is respectable. **Time-to-usable is not**, and the gap is almost entirely the
splash screen. I could not run Lighthouse; these are direct CDP measurements.

---

## PART 5 - SECURITY AND DATA

### Secrets

**None.** No `.env` file, no `process.env` read anywhere in `app/`, `lib/`,
`engine/`, `mocks/`, `components/`, `content/`. Nothing to leak into the client
bundle because nothing is read. Clean.

### What `/api/mock/*` exposes to an unauthenticated caller

```
curl /api/mock/mUIDAI?ref=P1                     -> 200 + full synthetic record
curl -H "Origin: https://evil.example" ...       -> 403 {"error":"CROSS_ORIGIN_BLOCKED"}
```

The same-origin check works against browsers and **does nothing against a caller
that omits `Origin`**. Impact is nil - the response is
`{"aadhaar_ref":"9999 4412 8830","name":"Lakshmi Devi",...}`, entirely synthetic
and test-guaranteed to be structurally invalid as a credential. This is a
**disclosure-accuracy** issue, not a security one (F11).

### Input validation

Hand-rolled, and it holds:

```
POST /api/lookup {"identifier":"9999 4412 8830"}  -> 200 {"reference":"NSH-D33F","hasLinkedMobile":false}
POST /api/lookup {"identifier":{"$ne":1}}         -> 400 {"error":"BAD_REQUEST"}
POST /api/lookup  not json                        -> 400 {"error":"BAD_REQUEST"}
```

### §12.6 controls

| Control | Status |
|---|---|
| HTTPS and HSTS | **Present** (`max-age=63072000; includeSubDomains; preload`) |
| **CSP** | **ABSENT** |
| **`X-Content-Type-Options: nosniff`** | **ABSENT** |
| **`Referrer-Policy`** | **ABSENT** |
| **`Permissions-Policy`** (deny camera/geo/mic) | **ABSENT** |
| Parameterised SQL only | **N/A** - no database |
| **Rate limiting** | **ABSENT.** 25 rapid `POST /api/lookup` gave 25 x 200. 20 rapid `GET /case/:ref` gave 20 x 200. §12.6 specifies 20/10 min and 10/min |
| API keys in env only | **N/A** - no keys |
| Lockfile committed | **Present** |
| gitleaks pre-commit | **Not present** |

Four of five header controls are missing. `Permissions-Policy` is the one worth
fixing first for reasons beyond security: the build's honesty claim is that the
mic button requests no permission, and that header would *prove* it in a way a
judge can check in devtools in five seconds.

### Real personal data

**None found.** `tests/personas.test.ts:160-216` walks every string in every
record of all eight personas and asserts: 12-digit runs are `9999`-prefixed,
`+91` numbers use the unallocated 5-series, IFSC tokens are `MOCK`-prefixed, PAN
tokens are `MOCKP`-prefixed, accounts are `MOCKACC-####`, registrations are
`NSHDEMO-####`. The same guarantee is re-asserted on assembled snapshots, not
just fixtures. Verified live against `/api/mock/mUIDAI`.

---

## PART 6 - GAP ANALYSIS AGAINST THE PITCH

### The five capabilities of §6.1

| Capability | Ships? | What actually exists |
|---|---|---|
| **1. Diagnose** | **Fully** | Deterministic engine, fixed precedence, evidence-carrying, INDETERMINATE enforced by declared dependencies, seven mock systems with fault injection. All eight personas correct in production |
| **2. Explain** | **Fully** | One-sentence verdict in the largest type, "why this happens" body, evidence table with system / what it says / what it should say. Read-aloud works. Hindi and Marathi resolve (with the F4 caveat) |
| **3. Resolve** | **Mostly** | Fix Path with ordered steps, persisted progress, carry list, time-to-effect, named authority, and ruled-out routes with the reason stated. Visit Slip is print-perfect. **Missing:** no self-serve inline e-KYC completion - §11.7 S6 promises the user "never leaves" (P10), and they do |
| **4. Escalate** | **Does not ship** | No grievance draft, no fact chips, no filing, no SLA clock, no tier routing, no CPGRAMS. Cut per §15 and disclosed on `/whats-real` |
| **5. Track** | **Does not ship** | Events are appended (`lib/store.ts:143`) but no timeline screen renders them. `RESOLVED_CREDITED` exists as a type and is reachable only because Govindan S. is seeded already-credited - no case ever *transitions* into it |

**Two of five capabilities are absent, and both are disclosed.** The honesty page
is straight about this. But the pitch in §6.1 and the video script both lead with
"a cause, an action, **and a clock**" - and there is no clock.

### Claims not backed by working code

A mentor will test exactly these:

1. **§17 video script, 1:30-1:45:** "Grievance screen: fact chips... Then the SLA
   clock and auto-escalation via time travel." **None of this exists.** If the
   submitted video shows it, that is the single largest credibility risk in the
   package. If the video was re-cut, verify it.
2. **§17 video script, 0:50-1:00:** "The failure moment... 'You're offline.
   Everything is saved on your phone.' Reconnect. Nothing lost, nothing
   duplicated." The service worker and outbox were cut (§15). `ConnectionStrip`
   exists; a replay queue does not. §15 already warns "the video should
   demonstrate what actually exists and claim nothing more" - **confirm the cut
   video obeys it.**
3. **`/whats-real` Languages row** - "fully resolved" is true of the catalogue and
   false of the experience (F4).
4. **`/whats-real` mock endpoint isolation** - the check is weaker than the
   sentence implies (F11).
5. **CLAUDE.md §6.3** - "Fix Path progress survives a reload" is **true**.
   "The language selector... states plainly which are not yet resolved" is
   **true**. Both hold up.

---

## PART 7 - PRIORITISED FINDINGS

| ID | Sev | Area | What is wrong | Why it matters | Effort |
|---|---|---|---|---|---|
| **F1** | **P0** | Availability | With JS disabled or failed, **every route is a blank pale screen**. `.nishan-loading-screen` is `position:fixed; inset:0; z-index:100; opacity:1` (`app/globals.css:192-201`), removed only by a `useEffect` in `components/NishanLoader.tsx:22-23`. No `<noscript>`, no CSS escape hatch | Fully server-rendered content sits underneath, unreachable. On a Rs 7,000 Android on 2G - the stated user - a stalled chunk means the product is simply gone. A judge on hotel wifi sees a blank page and scores nothing | 15 min |
| **F2** | **P0** | Performance / first impression | Mandatory **2,000 ms** splash (`NishanLoader.tsx:6,19`) on first visit per session, on top of hydration. Measured time-to-usable: **4.0 s on fast 3G, 8.4 s on slow 3G** | It is the first thing every judge experiences, and the pitch is "simpler and faster than the government portal". Losing 8 seconds to a spinner argues the opposite | 10 min |
| **F3** | **P0** | Core UX | The pinned primary action is **not pinned on any screen**. `.page-in { animation: ... both; }` (`app/globals.css:168`) leaves a permanent `transform` on `main`, making it the containing block for its `position:fixed` children. "Fix this" sits at y=2297 of a 3395 px page; `/fix` at 1868; `/who/verify` at 599; `/demo/new` at 1564. Each screen also reserves `pb-40` for a bar that is not there | §11.5 pins the primary action for thumb reach. A judge on the diagnosis screen must scroll most of the page to find the one button that continues the journey. **One-line cause, four screens fixed** | 10 min |
| **F4** | **P1** | i18n / honesty | Locale lives in React state only. `localStorage` is empty after switching; any full page load reverts to English. `<html lang>` is hardcoded `en` (`app/layout.tsx:20`) and never updates | `/whats-real` claims Hindi and Marathi are "fully resolved". A judge who picks हिन्दी, then opens any link, is back in English - which reads as the claim being false. Screen readers also pronounce Devanagari with an English voice (§11.8) | 45 min |
| **F5** | **P1** | §16.4 and §16.5 | `mocks/fixtures.ts:99` renders **"B4 mapper inactive - approved money with nowhere to land"** on `/who` and `/demo`, plus raw codes "B3"/"B4"/"B5". Hardcoded English also at `app/demo/PersonaPicker.tsx:122-125,175` and `components/NishanLoader.tsx:34,38` | "mapper" is on the §16.5 banned list. The four tests that enforce that list scan catalogues only, so the violation ships silently on the identify screen - the first screen after entry | 1 h |
| **F6** | **P1** | SSR / slow networks | `/who/verify` is a client component in `<Suspense fallback={null}>` (`app/who/verify/page.tsx:100`). Server HTML for the OTP screen is **empty** | A primary-path screen with zero server-rendered content is a blank page on a slow connection, and it compounds F1 | 20 min |
| **F7** | **P1** | Accessibility | 56 serious `color-contrast` nodes across all 30 route-views. "Prototype" badge: `--pending` as text on white = **3.08:1**, on every page, forbidden by name in §11.3 rule 3. Rail "Passed" labels: `--ink-soft` on `--green-soft` = **3.58:1**. Hero body copy on teal = 5.32:1, under the 7:1 bar | Accessibility is inside the judged usability criterion, and CLAUDE.md predicted the exact failing ratio before it shipped | 45 min |
| **F8** | **P1** | Honesty page | `/whats-real` renders a **row of three bare hyphens**. `app/whats-real/page.tsx:27-31` declares 19 `STATUSES`; the catalogue has 18 rows (`real.row.0` to `17`), so row 18 resolves to `MISSING_SLOT` | A visible rendering bug on the one page whose entire job is to look rigorous | 5 min |
| **F9** | **P1** | Robustness | No `error.tsx`, `not-found.tsx` or `global-error.tsx` anywhere in `app/` | Any unhandled error drops the judge onto Next.js's default English error page. Cheap to prevent, expensive to be seen | 30 min |
| **F10** | **P1** | Visual | `FieldBackdrop` draws 7-10 stretched full-width rects at 16% opacity (`components/FieldBackdrop.tsx:79-95`). On a wide hero this renders as **horizontal stripes across the headline**, not furrows. Same component stripes "About the scheme" | It is the first thing on the page and it reads as a rendering bug. Deleting it is a net improvement; there is no third state to design | 15 min |
| **F11** | **P2** | Disclosure accuracy | `/api/mock/*` blocks a foreign `Origin` (403) but serves any request that omits `Origin` entirely | Data is synthetic so impact is nil, but `/whats-real` implies a stronger control than exists. The honesty page's value comes from being exactly right | 20 min |
| **F12** | **P2** | Spec | No "Delete this case" control on `/whats-real`, only prose. §12.2 and §12.5 both require it | A judge reading §12.5 will look for the button | 30 min |
| **F13** | **P2** | §16.3 | `BhashiniWidget` is a fixed bottom-right pill that expands a panel - the chat-launcher silhouette §4 says to avoid, even though it holds no conversation | Low risk (it says "Coming soon"), but §4's whole argument is "do not look like the incumbent chatbot" | 30 min |
| **F14** | **P2** | Doc drift | CLAUDE.md §10.2 still says English is the only resolved locale; §13 predates 20 commits; §14 and §15 predate the 28 Aug objective change. `/services`, `/faq`, `/contact`, `/how-it-works`, `/demo/new`, the splash and the testimonials are all outside §14 | Rule §16.1 makes CLAUDE.md authoritative. Right now the build and its specification disagree in a dozen places, and §16.12 reads as violated when it was actually a deliberate scope change | 1.5 h |
| **F15** | **P2** | R1 | BUILDLOG stops at "Session 11". Zero coverage of the loading screen, `how-it-works`, or the 20 commits from 28 Aug 10:09-23:54 | R1 makes "how it was built with Codex" 50% of the judged video. The log is the raw material and it is a day short | 1 h |
| **F16** | **P2** | Touch targets | Footer links 40 px, logo 36 px, "Listen" 40 px, `<summary>` toggles 21-28 px, demo filters 40 px, against §11.5's 48 px floor | Thumb accuracy on a shared phone is the stated design constraint | 30 min |
| **F17** | **P2** | Test scope | `tsconfig.test.json:23` excludes `app` and `components`. `lib/store.ts`, `lib/demoCase.ts`, `lib/languages.ts` have no coverage at all | Directly responsible for F4, F5 and F8 shipping unnoticed. The case layer - reference derivation, gate mapping, the event log - is entirely untested | 2 h |
| **F18** | **P2** | §12.6 | No CSP, no `nosniff`, no `Referrer-Policy`, no `Permissions-Policy`, no rate limiting (25/25 rapid lookups all 200) | Four of five specified header controls absent. `Permissions-Policy: microphone=()` would also *prove* the mic claim in devtools | 45 min |
| **F19** | **P3** | Money Rail craft | Four "Not reached" gates are as large as meaningful ones and consume approx half the rail's height; the desktop right column ends early, leaving an empty well | It works and it is clear. It is not yet the memorable object §11.2 asks for | 3 h |
| **F20** | **P3** | Dead code | `db/schema.sql` is never executed by any code path; `FieldBackdrop`'s `PHOTOS[]` branch is unreachable | Reads as implemented persistence to anyone skimming the repo | 15 min |

### Order to fix the P0s

**F1 then F2 then F3.** They are not independent, and this order is the cheapest path.

- **F1 first** because it is the only finding where the product can be *entirely
  unavailable*. Everything else assumes the page rendered.
- **F2 second, and it very nearly fixes itself with F1.** The honest fix for both
  is the same: delete the splash, or gate it behind a CSS-only animation that
  removes itself without JavaScript. F2 alone (drop 2000 to 0) still leaves the
  no-JS blank screen, so F1 must lead.
- **F3 third** because it is one line (`animation: ... both` becomes `backwards`,
  or move the bars out of `main`) and it repairs the primary action on four
  screens at once. It is the highest ratio of judged-experience-recovered to
  effort in this report.

**If F2 and F3 compete for the last slot before submission: F3 wins.** A slow
first load annoys a judge once. An invisible primary action on the diagnosis
screen - the screen §11.7 says is 60% of the demo - can stop the journey outright,
and R3 requires the reviewer to complete it start to finish.

---

## Closing

### The three things that most limit this project right now

1. **The shell is fighting the product.** The engine, the personas, the fault
   injection, the Fix Path and the Visit Slip are genuinely strong and provably
   work in production. Everything that stands between a judge and them - a 2-8
   second splash, a blank screen if JS falters, a primary action pushed below the
   fold - was added in the last fourteen hours before the deadline and none of it
   was tested. The best work in this repository is currently hidden behind the
   worst.

2. **Nothing above the content layer is tested, so the UI regresses silently.**
   `app/` and `components/` are excluded from the suite by configuration. Three
   separate findings here (F4, F5, F8) are defects that any smoke test would have
   caught, and 156 green tests reported nothing. Until a handful of route-level
   tests exist, every UI change is unverified, and the last day before a deadline
   is exactly when UI changes happen fastest.

3. **Two of the five promised capabilities do not exist, and the pitch still
   promises five.** Escalate and Track are absent. `/whats-real` is honest about
   it; §6.1, §17's video script and the "cause, action, and **a clock**" line are
   not. A mentor who reads the pitch and then uses the build will find the clock
   missing. Either build the grievance and the SLA clock for Stage 2 - §14
   already names it as the first thing back - or align the pitch to four
   capabilities and make the Visit Slip the closing argument instead.

### The one thing that would most improve it

**Delete the loading splash.** One component, and it resolves F1 and F2 together -
the only two findings that can cost a judge the whole product. It converts a
blank 8-second screen on 2G into a 964 ms first paint of a page that is already
fully server-rendered, and it restores the product's core claim - that this is
faster and simpler than the government portal - to something a judge experiences
in the first second rather than has to take on trust.

*Runner-up, if the splash stays for brand reasons:* the one-line `.page-in` fix
(F3). Ten minutes, four screens, and it puts the primary action back where the
specification always said it should be.
