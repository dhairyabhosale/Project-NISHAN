# NISHAN - Credits and authorship

Hackathon requirement **R1** asks that Codex be a meaningful part of *how* this
was built. This file records, file by file, what Codex authored and what was
written afterwards. [BUILDLOG.md](BUILDLOG.md) carries the session narrative.

## How this attribution was established - read before citing it

This project is **not currently under version control**, so there is no commit
history to attribute from. The attribution below rests on three converging
pieces of evidence, and is stated as inference, not as proof:

1. **Filesystem timestamps.** Every file in the original scaffold has a
   modification time between **17:14 and 17:22 on 26 August 2026** - a single
   eight-minute window, in dependency order: config → types → engine/mocks/db →
   components → routes. That is the signature of one generation run, not of
   hand-authoring.
2. **Uniform style.** All seventeen generated `.ts`/`.tsx` files share an
   unusual and perfectly consistent convention - components emitted as a single
   long line, `TODO(scope):` markers in exactly the same form in each stub.
3. **The project's own record.** CLAUDE.md §2.2 states "Codex authored the
   scaffold and core layer," and the generated `README.md` describes itself as an
   "offline scaffold" with an accurate list of what it left stubbed.

Where a file has been touched since, it is listed under both authors with the
specific change named. **Do not present this as git-verified provenance in the
video or the submission.** If stronger provenance is needed before 28 August,
initialising a git repository now would give every subsequent change a
verifiable author and timestamp.

---

## Authored by OpenAI Codex - 26 August 2026, 17:14–17:22

### Project configuration
| File | Notes |
|---|---|
| `package.json` | Minimal dependency set; already named `pm-kisan-nishan` |
| `tsconfig.json` | `strict: true` |
| `next.config.mjs` | |
| `postcss.config.mjs` | |
| `tailwind.config.ts` | Colour set is off-spec against CLAUDE.md §11.3 |
| `next-env.d.ts` | Next.js generated |
| `README.md` | Accurate about what is stubbed |

### Type layer
| File | Notes |
|---|---|
| `lib/types/blocker.ts` | `Blocker`, `Verdict`, `Precedence` |
| `lib/types/case.ts` | `CaseState` has 4 states; §8.6 needs 12 |
| `lib/types/events.ts` | Append-only event shape, incl. `idempotencyKey` |
| `lib/types/systems.ts` | Seven interfaces over one generic shape, no per-system fields |

### Content layer
| File | Notes |
|---|---|
| `content/catalogue.en.json` | 79 keys as generated - **modified since**, see below |
| `content/catalogue.hi.json` | 79 keys as generated - **modified since**, see below |
| `content/resolve.ts` | Slot-filler - **modified since**, see below |
| `content/statusCodes.json` | 8 codes; taxonomy conflicts with §7.2 |
| `lib/content.ts` | `CatalogueKey` derived from the catalogue - **modified since** |

### Engine, mocks, database - all stubs
| File | Notes |
|---|---|
| `engine/diagnose.ts` | `diagnoseCase()` throws; no rules implemented |
| `engine/precedence.ts` | `BLOCKER_PRECEDENCE` array; nothing consumes it |
| `mocks/index.ts` | `readMockSystem()` returns `null`; seven no-op exports |
| `db/schema.sql` | 4 tables, `TODO(db)`, never executed |

### Routes
| File | Notes |
|---|---|
| `app/layout.tsx` | |
| `app/globals.css` | Includes the reduced-motion-safe marker animation |
| `app/page.tsx` | Entry screen - **modified since**, see below |
| `app/assisted/page.tsx` | Consent is `useState` only, not persisted |
| `app/case/[id]/page.tsx` | Renders the sample case only; never calls the engine |
| `app/whats-real/page.tsx` | Prose sections, not the §12.2 table |

### Components - all thirteen
`ActionChecklist.tsx` · `BlockerCard.tsx` · `CaseHeader.tsx` ·
`ConsentBanner.tsx` · `LanguageToggle.tsx`\* · `LocaleProvider.tsx` ·
`MicButton.tsx` · `MoneyMarker.tsx` · `MoneyRail.tsx` · `NishanLogo.tsx` ·
`RailGate.tsx` · `SiteChrome.tsx` · `StatusCodeChip.tsx`

\* modified since - see below.

### Sample data
| File | Notes |
|---|---|
| `data/sample-case.json` | The single sample case - **modified since**, see below |

---

## Authored by Claude (Claude Code) - 26 August 2026, session 2

### Created
| File | What it is |
|---|---|
| `BUILDLOG.md` | This project's build log |
| `CREDITS.md` | This file |
| `content/catalogue.ta.json` | Tamil catalogue: all 80 keys, values `TODO_TA:`-prefixed English. **No Tamil prose was written or machine-translated.** |

### Modified
| File | Change |
|---|---|
| `CLAUDE.md` | Rewrote §9.1, §9.3, §9.4, §10.1, §11.2 to match the real tree; replaced §13 entirely with an audited three-list build status plus §13.4 |
| `app/page.tsx` | Case reference `sample-pmk-001` → `NSH-4F2A` (§1.1, §12.3) |
| `data/sample-case.json` | Same rename |
| `content/catalogue.en.json` | Same rename; added `language.ta`; reformatted to one key per line |
| `content/catalogue.hi.json` | Added `language.ta`; reformatted to one key per line |
| `content/resolve.ts` | Imported and registered the `ta` catalogue |
| `lib/content.ts` | `Locale` widened to `"en" \| "hi" \| "ta"` |
| `components/LanguageToggle.tsx` | Added `"ta"` to the offered locales |

**No feature code was written in session 2.** The diagnosis engine, the mock
systems layer and every screen beyond the four generated routes remain as Codex
left them. See CLAUDE.md §13 for the audited status of each.

---

## Third-party

| Component | Licence |
|---|---|
| Next.js, React, React DOM | MIT |
| Tailwind CSS, PostCSS, Autoprefixer | MIT |
| TypeScript | Apache-2.0 |

No fonts are currently bundled - `app/globals.css` falls back to system faces.
CLAUDE.md §11.4 specifies the Anek superfamily and IBM Plex Mono (both SIL OFL);
if they are added, retain their licence files per §12.6.

All user-facing copy in `content/catalogue.*.json` is original to this project.
