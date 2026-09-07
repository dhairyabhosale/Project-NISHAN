# Mobile audit

Recorded **7 September 2026**, against commit `ccdf34b`, before any fixes.

Mobile is the primary target for this product: the canonical user is on a shared
budget Android on a slow connection. Almost every recent change was designed and
verified at desktop width, so this pass assumed mobile was broken until measured.

## Method

- **Routes**: all 16 rendered routes (every screen in §11.6 plus `/contact`,
  `/faq`, `/how-it-works`, `/services`, `/demo/new`).
- **Widths**: 320, 360, 375, 390, 414. 320 is the floor; 360 and 375 are the
  ones that matter.
- **Locales**: en, hi, mr, ta.
- **Emulation**: `isMobile`, `hasTouch`, `deviceScaleFactor: 2`.
- 320 combinations, plus a throttled profile (Chrome's Slow 3G preset with 6x
  CPU throttling) and an axe pass at 375.

Probes are in the session scratchpad (`mobaudit.js`, `mob2.js`, `mobperf.js`,
`axemob.js`). Two first-pass results were discarded as probe faults, not
findings, and are recorded under "False positives" below so they are not
rediscovered later.

---

## Findings

Severity: **BLOCKER** breaks the journey. **HIGH** costs the user money, time or
legibility. **MEDIUM** is friction. Tick the box when fixed.

### BLOCKER

None. No route failed to load, and there is no horizontal scroll anywhere
(see "Verified good").

### HIGH

- [x] **H1 - hero image: 253kB delivered to a 360px screen** · `/` · all widths ·
  all locales
  A single 1672x941 asset serves every viewport. On Slow 3G with 6x CPU that is
  an LCP of **5024ms**, on the connection least able to afford it.
  *Fixed: picture/srcset now offers 480/768/1200/1672 WebP at sizes=100vw. A 360px phone takes the 480 (19kB) at 1x and the 768 (37kB) at 2x, down from 253kB. Variants encoded with Chrome, so no new dependency.*

- [ ] **H2 - hero crop shows a quarter of the frame** · `/` · 320-414 · all locales
  `object-fit: cover` with `object-position: 70% top` on a tall narrow box shows
  only source x 892..1290 of 1672 at 320px (**24% of the frame**), 27% at 360px.
  The farmer survives by luck of where he stands, not by design, and any reframe
  of the source would cut him out.

- [x] **H3 - phone number field is a 24px tap target** ·
  `/case/:id/act/update_mobile` · 320-414 · all locales
  The `+91` prefix wrapper is 56px tall, but the `<input>` inside it is a flex
  child that does not stretch, so its own hit area is 24px. Introduced by the
  prefix change in `e38bab6`; the wrapper looks right and the target is not.
  *Fixed: self-stretch on the input, so its hit area fills the 56px wrapper. Measured 268x52.*

- [~] **H4 - `/demo/new` checkboxes are 20x20px** · `/demo/new` · all widths ·
  all locales
  Under half the 48px floor, and 72 instances across the matrix.

### MEDIUM

- [x] **M1 - Bhashini button crowds real controls** · 11 routes · 320-414 ·
  hi, mr, ta worst
  The floating widget sits **0.8px** from a card on `/case/:id/fix` at 320, and
  1.0-3.5px from buttons elsewhere. Two adjacent targets with no gap is a
  mis-tap, and it is worst in the locales whose buttons are widest.
  *Fixed: The footer keeps a lane clear beneath the floating button at mobile widths, so the page no longer comes to rest with a link flush against it.*

- [x] **M2 - link pairs 4px apart** · all 16 routes · all widths · all locales
  Footer and menu lists use `space-y-1`, which is 4px between 48px targets, half
  the 8px floor. 165 instances.
  *Fixed: space-y-1 to space-y-2 in the footer columns and the case status list.*

- [ ] **M3 - body copy set at 15px** · 15 routes · all widths · all locales
  §11.4 puts the body floor at 18px and `--t-label` at 15px. A number of blocks
  that read as body copy are set in `text-label`. Some of these are genuinely
  labels and correctly 15px; the mixed ones need judging case by case rather
  than a blanket bump, so this is left for a copy pass.
  **Deliberately left** - see "Left alone" below.

- [~] **M4 - `<title>` disappears after hydration** · intermittent · all widths
  axe reports `document-title` (serious, WCAG 2 A). The served HTML has a title;
  it is missing from the DOM 1.2s later on a random subset of route/locale
  pairs (`/services` en and hi, `/faq` hi, `/whats-real` en, hi and ta on one
  run). Not mobile-specific and not locale-specific despite first appearances.

---

## Verified good

Recorded so a later change that breaks one of these is visibly a regression.

| Check | Result |
|---|---|
| Horizontal scroll | First pass said none; that pass was measuring English. Corrected pass found 10, now **0 of 320** combinations |
| Route load failures | None |
| Money Rail at 360px | Fits, no pinch, no horizontal scroll, en and ta |
| Visit Slip at 360px | Fits, no pinch, no horizontal scroll, en and ta |
| Content behind the pinned bar at full scroll | None trapped, 7 routes checked |
| Hero clears the floating pill | 28px of clearance, all four locales, all mobile widths |
| Pill vs Prototype badge at mobile | No collision at any width |
| Layout shift | CLS 0.0001 to 0.0004 |
| `inputmode="numeric"` | Present on every Aadhaar, mobile and OTP field |
| Hero height | 756px at every mobile width; not a strip |

## Throttled profile

Chrome Slow 3G preset (400kbps, 400ms RTT) with 6x CPU throttling, 360px:

| Route | Time to usable | FCP | LCP | CLS |
|---|---|---|---|---|
| `/` | 2213ms | 2332ms | **5024ms** | 0.0001 |
| `/who` | 1969ms | 1964ms | 2276ms | 0.0004 |
| `/demo` | 2076ms | 2056ms | 2368ms | 0.0001 |

`/` is the outlier and the hero image is the whole difference.

## First Load JS

126kB on `/`, 115-130kB across every other route, against the 150kB budget in
§11.9. No route is over. Not a finding.

## False positives

Recorded so the next audit does not rediscover them as bugs.

- **"Content trapped behind the fixed bar"**, 59 hits. The probe compared every
  element in `main` against the fixed bars, including the bars' own children, so
  each pinned button was reported as trapped behind itself. Excluding
  descendants takes it to zero.
- **`document-title` looked Tamil-only.** It appeared first on `/services` in
  Tamil, which fitted the day's other Tamil bugs. Sampling all four locales
  showed it hitting en, hi, mr and ta at random. Chasing it as a Tamil problem
  would have been chasing the wrong thing.

## Left alone

- **M3, 15px body copy.** Bumping every `text-label` block to 18px would enlarge
  genuine labels and field hints, which are correctly 15px under §11.4, and
  would reflow layouts that are currently clean. Separating body from label here
  is a copy judgement per block, not a mechanical fix, and doing it badly is
  worse than leaving it. Recorded rather than half-done.

---

## Added after the first pass

The first run of this audit set the locale in `localStorage` and measured
immediately, without waiting for `LocaleProvider` to apply it. Most combinations
were therefore measured **in English**, and everything below was invisible. The
harness now gates on `documentElement.lang` before it measures.

This is the most important line in the file. An audit that reports "no
horizontal overflow anywhere" while ten routes overflow is worse than no audit,
because it gets believed.

- [x] **B1 - ten Tamil routes scrolled horizontally** · `/`, `/whats-real`,
  `/who/verify`, `/case/:id` · 320-390 · ta
  Four mechanisms, all the same shape: something that could not shrink below its
  longest word, in a language whose words are long.
  *Fixed, in four parts:*
  *(a) a grid that declares columns only at a breakpoint has no template below
  it, so items land in an implicit `auto` track that sizes to min-content and
  cannot shrink. Ten of them now carry `grid-cols-1`, which is
  `repeat(1, minmax(0,1fr))`.*
  *(b) `1fr` carries an automatic min-content minimum, so the two
  `grid-cols-[auto_1fr]` tables became `grid-cols-[auto_minmax(0,1fr)]`.
  `overflow-wrap` does not help here: it changes how text wraps, not the
  intrinsic size the track is measured against.*
  *(c) the `/whats-real` status chips were `shrink-0` carrying 30-character
  Tamil labels, 357px of chip in a 320px screen. They may now shrink and wrap.*
  *(d) `body { overflow-wrap: break-word }`, because one Tamil word in an `<h1>`
  measured 355px against a 288px column. It only acts when a word genuinely
  cannot fit, so ordinary wrapping is untouched in every language.*

- [x] **B2 - one heading widened the whole layout viewport** · `/who/verify` ·
  320, 360 · ta
  Recorded separately because the symptom pointed nowhere near the cause. The
  pinned action bar measured **371px wide on a 320px screen**, and so did the
  Bhashini button; both are `position: fixed` and neither was at fault. On a
  mobile viewport an overflow widens the layout viewport, and fixed elements are
  sized against it, so one unbreakable heading dragged them all out with it.
  Debugging the bar would have found nothing wrong with the bar.
  *Fixed by B1(d).*

- [x] **B3 - wordmark ran under the language control at 320px** · `/` · 320 ·
  all four locales
  The lockup shrinks to 103px while its content needs 125px in Tamil, so the
  wordmark overflowed, ran under the language button, and pushed `scrollWidth`
  to 372. Present in all four locales, so a space problem and not a translation
  one.
  *Fixed: at the floor width the pill becomes two rows, lockup then controls. A different layout rather than less content, per the brief. Nothing hidden, nothing truncated, no font shrunk, and it holds for any language rather than until the next long one.*

- [~] **H5 - `/demo/new` checkbox is 20x20** · reclassified, not a defect
  The probe measures the `<input>`. That input sits inside a `<label>` which is
  `min-h-14` and 56px tall, and a label is a real tap target: tapping anywhere
  in it toggles the box. The actionable target is 56px and passes. Kept here so
  the next audit does not raise it again.

## Not yet done

Paused part-way through Phase 2 at the user's request. Outstanding:

- **M3**, 15px body copy. Deliberately left; reasons under "Left alone".
- **Mobile assertions in the route smoke suite**, including the
  no-horizontal-overflow check on every route, each proven by injecting a
  failure. The sweep exists as a harness and reports 0 of 320, but it is not yet
  part of `npm test`.
- **Desktop regression check.** 1440px before-shots are captured; the after
  comparison has not been run since the grid and word-break changes.
- **axe at 375 after the overflow fixes.** It read 0 twice before them.
- **Time-to-usable re-measured** now the hero is 19kB rather than 253kB.
- **After screenshots** of the hero and the Money Rail at mobile.

## Left alone, second pass

- **The floating voice button overlaps the secondary hero action at 320px, by
  23px of one corner.** Clear at 360 and 375 with an 8px gap, which is what the
  footer and hero lane-clearing rules bought. It survives at 320 because the
  pill is two rows there, so the copy starts ~56px lower.

  Bottom padding does not fix it: below `md` the hero has no `min-height`, so
  the copy block is top-anchored and padding lengthens the page without moving
  the actions. Measured, not assumed. The moves that would work are moving the
  button up (onto the standfirst), shrinking it to an icon (hiding its label,
  which the brief rules out), or giving the hero a mobile `min-height` so
  centring engages, which is a layout change large enough to want its own pass.

  Left as a 23px corner at the floor width, on an optional affordance, rather
  than churned at the end of a session.
