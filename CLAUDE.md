# NISHAN — Project Guide

**This file is the single authoritative specification for this repository.**
It replaces six earlier documents (research, PRD, architecture, security,
frontend spec, tickets). Where anything else in this repo — a comment, a README,
an older doc — contradicts this file, **this file wins**. Flag the contradiction;
do not resolve it silently.

---

## 0. How to use this document

| If you are about to… | Read |
|---|---|
| Rename anything | §1 |
| Decide whether a feature is in scope | §2, §6, §14, §15 |
| Write diagnosis logic | §7, §8.2 |
| Write UI | §11 |
| Write copy shown to a user | §10, §11.9 |
| Touch anything AI-related | §9 |
| Write a disclosure, banner or `/whats-real` row | §12 |
| Decide what to build next | §13, §14 |
| Decide what to abandon | §15 |

**Non-negotiable rules are in §16. Read them before your first edit.**

---

## 1. Identity

> **NISHAN** (निशान) — *Nidhi Investigation, Status, Help & Accountability Navigator*
> **"आपके ₹2,000 का निशान — Your ₹2,000 left a trace. We follow it."**

*Nishan* means **trace, mark, trail**. Money moving through the PM-KISAN pipeline
leaves a trace across seven government systems. When ₹2,000 fails to arrive, that
trace still exists — the farmer simply cannot see it. NISHAN reads the trace,
finds the exact gate where the money stopped, and names the cause, the fix, the
responsible office, and the deadline.

### 1.1 Rename map — TASK 0, do this before writing any new code

The repository was built under the working name "Paisa Kahan Hai" (PKH). Every
occurrence must change. Run the rename, then run the test suite; the tests are
the check that nothing broke.

| Old | New | Where it appears |
|---|---|---|
| `Paisa Kahan Hai` | `NISHAN` | docs, README, UI copy |
| `PKH` (product name) | `NISHAN` | prose |
| `PKH-` (ticket ID prefix) | `NSH-` | docs, code comments |
| `PKH-XXXX` (case reference) | `NSH-XXXX` | code, schema, tests |
| `PKHDEMO-####` (reg. number) | `NSHDEMO-####` | fixtures, tests |
| `X-PKH-Fault` (header) | `X-NISHAN-Fault` | mock middleware |
| Tagline: *"Your ₹2,000 has a location. We'll find it."* | *"Your ₹2,000 left a trace. We follow it."* | UI, docs, video |

Old repo/package name `pkh` → `pm-kisan-nishan`.
**Do not rename anything else.** Type names, function names and file paths stay.

---

## 2. The hackathon this is built for

**Build What Moves India.** Stage 1 deadline **28 August 2026, 20:00 IST**, hard,
no grace period. Internal submission target **18:00**. Stage 2 (mentored
resubmission for the top 250) is 7 September 2026. Finals in Bengaluru, 12
September.

### 2.1 The ask, in one line

> Pick one real problem you have faced on an Indian public-service website or
> digital service, then build a simpler, clearer and more useful way to solve it.

### 2.2 Hard requirements

| # | Requirement | Consequence for this build |
|---|---|---|
| R1 | Built with Codex, or powered by an OpenAI model; Codex must be a meaningful part of *how* it was built | Codex authored the scaffold and core layer. Keep `BUILDLOG.md` and `CREDITS.md` current — they are the raw material for the video's second minute. |
| R2 | Solve **one** clearly defined user problem | Scope is "my instalment did not arrive." Nothing else. |
| R3 | Reviewer must complete the **main journey start to finish** | No dead ends. No "coming soon" on the primary path. |
| R4 | Easier to understand and use than the current experience | Must beat both pmkisan.gov.in **and** Kisan e-Mitra. |
| R5 | Designed for real Indian users: mobile, slow connections, limited digital experience | Mobile-first, offline-tolerant, multilingual, no captcha. |
| R6 | Mock/synthetic data everywhere personal info, payments, OTPs or government systems are involved | Full mock government systems layer. Zero real Aadhaar/PAN/bank data. |
| R7 | Live public link that opens without requesting access | Deploy early. Test in incognito on mobile data daily. |
| R8 | One video ≤ 2 minutes: minute 1 = citizen demo, minute 2 = how built and why | Scripted, §17. Do not improvise. |
| R9 | Project summary under 250 words | Write last, edit hard. |

### 2.3 Prohibited — absolute

- Accessing, testing, probing or interfering with any live government system.
- Reverse-engineering private systems or using undocumented private APIs.
- Scraping personal or restricted information.
- Real Aadhaar numbers, PAN, passwords, OTPs, payment details, health data.
- Presenting the prototype as an official government product.
- Government logos, emblems, the Ashoka Chakra, or the GoI wordmark — anywhere,
  including the video.
- Submitting an old project with minor changes.

### 2.4 Judging criteria, and how each is answered

| Criterion | Answer |
|---|---|
| **Problem** — real and important? | ~9.44 crore farmers per instalment; a blocked ₹2,000 is material household income. |
| **Working build** — does the main journey work? | End to end: identify → diagnose → fix path → grievance → tracked to money-in-account. |
| **Usability** — simpler, clearer, more accessible? | One cause, one action, one screen. Voice-out. Three languages. Works on 2G. |
| **Product thinking** — thoughtful, explained choices? | Deterministic diagnosis instead of LLM guessing; assisted mode; SLA clock. |
| **End-to-end thinking** — backend, infra, process, not just UI? | Seven mocked source systems, reconciliation engine, idempotent case machine, offline queue, escalation ladder mapped to the real nodal-officer hierarchy. |
| **Honesty** — limitations and mock data disclosed? | Persistent banner + `/whats-real` enumerating every mock. |

**Strategic consequence:** the 28 August build must be **complete on one journey**,
not feature-rich. Depth and polish are Stage 2. Do not spend Stage 1 hours on
anything the reviewer will not touch.

---

## 3. The problem

### 3.1 The scheme

Pradhan Mantri Kisan Samman Nidhi: income support to landholding farmer families.
**₹6,000 per year in three instalments of ₹2,000**, by Direct Benefit Transfer.
100% centrally funded; beneficiary identification is done by **State/UT
governments** against their own land records. Family = husband, wife and minor
children owning cultivable land. Tenant farmers are not eligible. e-KYC is
mandatory. Payment goes **only to Aadhaar-seeded bank accounts**. The 23rd
instalment was released **20 June 2026**: over ₹18,880 crore to more than
**9.44 crore** farmers.

### 3.2 What the portal shows, and what it means

This table is the product. It exists nowhere on the official portal, and it is
the thing every farmer is trying to reconstruct from rumour, YouTube and CSC
operators.

| String shown | What it means | What the farmer must do |
|---|---|---|
| `Payment Success` / `Credit Transferred` | Money sent to the bank | Check the passbook; allow 1–3 working days |
| `FTO Generated, Payment Under Process` | File approved, in the payment queue | Wait — usually clears within a week |
| `Rft Signed by State Government` | State verified and forwarded the request | Wait; not stuck |
| `Rft Generated` / `Payment Failed` | Technical problem with bank account details | Act — bank/NPCI fix |
| `Rejected by Bank` | Bank refused the credit | Act — account details or account state |
| `Stopped by State` | State-level eligibility or land-record problem | Act — Block/District Agriculture Officer |
| `eKYC Required` / `eKYC not done` | Blocked at the identity gate | Act — OTP, face auth, or CSC |
| `Aadhaar Seeding Status: No` | Account not mapped to Aadhaar in NPCI | Act — home bank branch |

### 3.3 The money pipeline

```
Department of Agriculture & Farmers Welfare
        │  (beneficiary list from State/UT land records)
        ▼
   State Government  ──►  Rft Signed by State Government
        ▼
      PFMS           ──►  FTO Generated
        ▼
      NPCI Mapper    ──►  Aadhaar → bank account resolution
        ▼
   Beneficiary Bank  ──►  Rejected by Bank / Credit Transferred
        ▼
    Farmer's account ──►  (the only state the farmer cares about)
```

Validation integrations confirmed publicly: **UIDAI**, **PFMS**, **Income Tax
Department**, **NPCI**, plus **state land-record systems** (Bhulekh, AnyROR,
Banglarbhumi and equivalents) and increasingly the **AgriStack Farmer Registry**.

**Six independent systems must agree before ₹2,000 moves. The farmer is shown the
symptom from whichever one disagreed — never the cause, never the fix.**

### 3.4 Documented failures of the current experience

These are the problems NISHAN exists to answer. Each is referenced by ID
elsewhere in this document.

| ID | Problem |
|---|---|
| **P1** | **Captcha on every citizen entry point**, including status lookup. Reported to fail silently in older mobile browsers. |
| **P2** | **Registration number as the primary key** — most farmers do not have it, so the real first step is a second lookup flow that itself needs Aadhaar or mobile plus captcha plus OTP. |
| **P3** | **OTP to the registered mobile**, which is frequently a number the farmer no longer uses — an unbreakable loop for exactly the users most likely to be blocked. |
| **P4** | **Farmers Corner is ~12 undifferentiated links**, several with near-identical names ("Know Your Status" vs "Status of Self-Registered Farmer"), with no indication which one answers "where is my money." |
| **P5** | **Rejection reasons are buried** in a link most users never open. |
| **P6** | **The status page is terminal** — it states a condition and offers no path onward. No "fix this," no "who do I contact," no clock. |
| **P7** | **The e-KYC dead end.** Web e-KYC depends on an Aadhaar-linked mobile OTP. When that number is stale, lost, or a relative's, the web path fails with no in-browser alternative. The user is ejected to a separate app download or a physical CSC visit. |
| **P8** | **Jargon as a wall.** "FTO Rejected." "Aadhaar not seeded." Backend field names leaked to a user surface. They convey that something is wrong and nothing about what to do. |
| **P9** | **Navigation as a literacy tax.** Grievance forms and status checkers are buried in text-heavy menus. Finding the right one requires knowing what it is called. |
| **P10** | **Forced channel-switching.** The portal cannot complete its own core task without ejecting the user to another app or a physical office. Every ejection is a drop-off point. |
| **P11** | **Intermediary dependence.** Because of P7–P10, farmers rely on paid agents to operate the portal for them. |

**NISHAN's answers:** P1/P2 → no captcha, no login, any one of three identifiers.
P3/P7 → sub-cause detection determines whether OTP is even possible before it is
offered. P4/P9 → single entry point, zero navigation to reach a diagnosis.
P5/P6/P8 → never display a raw status code without cause, action, owner and
clock. P10 → the whole journey stays on one surface. P11 → assisted mode is
first-class with recorded consent.

### 3.5 Second-order failure: channel confusion

There are a toll-free helpline, two Delhi landlines, two email IDs, a 24×7
grievance portal, an AI chatbot, CSC centres, and State/District/Block Nodal
Officers. **Most farmers do not know which channel handles which blocker**, so
everything piles onto the main helpline — including issues (land seeding,
district-level rejection, beneficiary-list exclusion) the central helpline
structurally cannot resolve because it has no access to state records.

### 3.6 The escalation ladder — publicly documented, invisible to users

| Tier | Owner | Window |
|---|---|---|
| 1 | Help Desk → concerned Nodal Officer (block/district) | ~15 days |
| 2 | Auto-escalation to **State Nodal Officer** | +15 days (30 total) |
| 3 | PM-KISAN Division, Krishi Bhawan; can direct PFMS to release funds | up to 60 days |
| Appeal | **CPGRAMS** — if closed without resolution or pending 30+ days | statutory |

Indicative timelines: simple issues (e-KYC OTP, bank details) 7–10 working days;
medium (Aadhaar linking, name mismatch) 15–20; complex (land seeding, eligibility,
duplicate) ~30; escalated 45+.

**A farmer is told none of this.** Surfacing the ladder and the clock — and
generating a correctly-addressed, correctly-worded grievance at the right tier —
is the differentiator.

### 3.7 What makes a grievance actually work

Vague complaints stall. A grievance naming the instalment, the release date, the
exact portal status string, the e-KYC state and the registration number resolves
faster because the officer does not have to come back and ask. **Farmers cannot
write this, because they cannot read the status page.** NISHAN holds every one of
those facts at the moment diagnosis completes, so it generates the strong version
for free.

---

## 4. Competitive position — Kisan e-Mitra

The incumbent is a voice-based AI chatbot built with Wadhwani AI, EkStep and
Bhashini. Launched September 2023, upgraded February 2024. Eleven Indic
languages. **49 query categories answered from predefined response templates**
personalised with beneficiary data. Publicly reported at 20,000+ queries per day.

**Read that carefully.** The incumbent already does multilingual voice Q&A. It
answers *questions*. It does not: determine a single authoritative blocker across
systems, execute or guide a fix to completion, start and enforce an SLA clock,
escalate on a schedule, or track a case to the only outcome that matters — money
credited.

> **That gap is the entire product. The chatbot answers questions; NISHAN
> resolves cases.**

Consequence: **do not build a chatbot.** Do not add a chat widget. Do not frame
NISHAN as a conversational assistant. It is a diagnostic instrument.

---

## 5. Users

### 5.1 Primary — Lakshmi, 54, smallholder
Owns 1.2 acres in Thiruvallur. Received instalments 19–22; the 23rd never came.
Feature phone until last year, now a shared ₹7,000 Android. Reads Tamil slowly,
English not at all. The mobile number on her PM-KISAN record belongs to a phone
she stopped using in 2023. She does not know her registration number. She has
visited the bank twice and been told to "check online."

**Needs:** to know if the money is coming; if not, the one thing stopping it and
the one thing she must do.

### 5.2 Primary — Karthik, 26, the helper
Lakshmi's son, works in Coimbatore. Every scheme problem in the family routes to
him over WhatsApp. **He is the one who will actually open this product**, on his
own phone, on her behalf.

**Needs:** a definite answer in under two minutes without calling his mother for
an OTP; something he can send her or print.

**Design consequence:** assisted mode is not an edge case. It is the modal usage
pattern, and it is a first-class flow with a recorded consent step.

### 5.3 Secondary — CSC operator / village volunteer
Runs the same lookup thirty times a day. Needs speed, a printable slip, and
confidence the advice is correct.

### 5.4 Out of scope as users
Government officers, bank staff, scheme administrators. **Build no admin panel.**
Reviewers test the citizen experience.

---

## 6. Product thesis and goals

> PM-KISAN shows a **status**. The farmer needs a **cause**, an **action**, and a
> **clock**.
> We do not rebuild the disbursement backend. We rebuild the citizen's
> relationship to it.

### 6.1 Five capabilities — the whole product

1. **Diagnose** — deterministic rule engine reconciles seven mocked record
   systems and returns exactly **one primary blocker**, with the evidence that
   produced it.
2. **Explain** — one sentence, in the farmer's language, at a low reading level,
   read aloud on tap.
3. **Resolve** — a resumable *Fix Path* per blocker: what to do, where to go, who
   to meet, what to carry. Self-serve inline where possible; a printable slip
   where a physical visit is unavoidable.
4. **Escalate** — auto-drafted, fact-complete grievance routed to the correct
   tier, with the SLA clock started, auto-escalation at 15/30 days, and CPGRAMS
   text offered at day 30.
5. **Track** — a persistent case whose terminal state is **money credited**, not
   "grievance closed."

### 6.2 Design principles

| Principle | Consequence in the build |
|---|---|
| One cause, one action | Never display a table of six flags. Show the single blocking gate. |
| Speak outcomes, not systems | "Your bank has not linked your Aadhaar," never "NPCI mapper inactive." |
| The clock is a feature | Every state shows an expected-by date and what happens if it passes. |
| Assume a helper | First-class assisted mode with recorded consent. |
| Assume the network fails | Offline-first. Nothing is lost. Never ask the user to redo a completed step. |
| Never ask for what we can derive | No captcha. No registration number as a precondition. |
| Honesty is a UI element | Mock data labelled in place, not buried in a footer. |

### 6.3 Demo success criteria — what must be true on 28 August

- A reviewer with no context completes the full journey in **under 90 seconds**
  without instructions.
- Turning off the network mid-journey loses **nothing**.
- The reviewer can see, on a dedicated page, exactly which parts are real and
  which are mocked.
- Language switch to Tamil or Hindi changes **every** string on the primary path.
- The whole journey works at **375px wide** on a throttled connection.

### 6.4 Anti-goals

Not a chatbot. Not a portal redesign. Not a scheme-information site. Not an admin
dashboard. Not a replacement for PM-KISAN — a layer over the same processes.

### 6.5 The journey — this is what gets demoed

```
  ①  "My money didn't come"
        │  voice or tap · no login · no captcha
        ▼
  ②  Identify the beneficiary
        │  mock Aadhaar OR mock mobile OR reg. number · any one is enough
        │  assisted mode: helper declares consent
        ▼
  ③  Diagnose  ── reconcile 7 mock source systems ──►  ONE primary blocker
        │  shows the Money Rail: where the ₹2,000 is standing still
        ▼
  ④  Explain
        │  one sentence · farmer's language · read aloud · "why does this happen?"
        ▼
  ⑤  Fix Path
        │  self-serve inline (mock OTP e-KYC)  OR
        │  visit checklist: who, where, what to carry, printable slip
        ▼
  ⑥  Grievance (when a fix needs an officer)
        │  auto-drafted with every case fact · routed to correct tier · SLA clock starts
        ▼
  ⑦  Track
        │  case timeline · expected-by date · auto-escalation at 15/30 days
        ▼
  ⑧  TERMINAL STATE: "₹2,000 credited to your account on <date>"
```

**Design rule:** step ⑧ is the only success state. A closed grievance with no
money is a failure state and is displayed as one.

---

## 7. Blocker taxonomy — the core data model

Six blockers account for essentially all "my ₹2,000 didn't arrive" cases.

### 7.1 Precedence — B1 → B2 → B3 → B4 → B5 → B6

**Evaluation stops at the first blocking rule.** This is why the farmer sees one
thing, not six flags.

Ordering is by *what must be true first*: you cannot be paid if you are not
registered (B1), or excluded (B2), or unverified (B3), or have no account to be
paid into (B4), or if the state has paused you (B5). Only then does payment state
(B6) matter. This mirrors the real gate order in the disbursement pipeline, which
is why the verdict is defensible to an officer.

### 7.2 The blockers

| ID | Blocker | Farmer-facing sentence (EN) | Needs officer? |
|---|---|---|---|
| **B1** | Registration rejected / not registered | "Your application was not accepted. The reason recorded is: *{reason}*." | No (CSC assist) |
| **B2** | Excluded by eligibility rule | "Your record is marked under an exclusion rule: *{rule}*. If this is wrong, it can be challenged." | Yes |
| **B3** | e-KYC incomplete | "Your identity check is not finished. Until it is, no instalment can be paid." | No |
| **B4** | Aadhaar–bank link missing/inactive | "Your bank has not linked your Aadhaar to your account. The money has nowhere to land." | No (bank) |
| **B5** | Land record mismatch | "Your land record and your Aadhaar name do not match, so your state has paused your payment." | Yes |
| **B6a** | Payment in flight | "Your money has been approved and is on its way. Expected by *{date}*." | No |
| **B6b** | Payment failed at bank | "Your bank returned the payment. Your account details need correcting." | Yes |
| **B6c** | Credited, not noticed | "₹2,000 was credited on *{date}* to your account ending *{last4}*." | No |
| **B0** | Indeterminate | "We can't reach one of the government systems right now. Here's what we do know." | — |

### 7.3 Sub-causes — where the product actually lives

The blocker is not enough. The **sub-cause** determines which fix route works, and
that is the difference between useful and generic. Content is keyed on
`ReasonCode`, not `BlockerCode`.

| Blocker | ReasonCodes |
|---|---|
| B1 | `REGISTRATION_REJECTED`, `REGISTRATION_PENDING` |
| B2 | `INCOME_TAX_PAYER`, `GOVT_EMPLOYEE`, `PENSIONER`, `LAND_ACQUIRED_AFTER_CUTOFF`, `FAMILY_DUPLICATE` |
| B3 | `MOBILE_NOT_LINKED`, `DOB_MISMATCH`, `GENDER_MISMATCH`, `NAME_VARIANCE`, `EKYC_PENDING_ACTION` |
| B4 | `MAPPER_INACTIVE`, `MAPPER_NOT_FOUND`, `MAPPER_DIFFERENT_BANK` |
| B5 | `LAND_NAME_MISMATCH`, `LAND_NOT_SEEDED`, `STATE_HOLD` |
| B6a | `FTO_IN_QUEUE`, `RFT_SIGNED`, `SETTLEMENT_PENDING`, `NOT_YET_QUEUED` |
| B6b | `BANK_RETURNED`, `ACCOUNT_DORMANT`, `ACCOUNT_CLOSED` |
| B6c | `CREDITED` |
| B0 | `SYSTEM_UNREACHABLE` |
| — | `NONE` (nothing blocking) |

**The B3 case is the signature insight.** "Your e-KYC is pending" is useless.
*"The phone number on your Aadhaar is one you no longer use, so the code can
never reach you — there is another way"* is the entire product. Recommending OTP
e-KYC to someone whose Aadhaar mobile is dead is the single most common piece of
bad advice in this domain, **and the portal gives it by default** (P3, P7).

---

## 8. Architecture

### 8.1 Architectural thesis

The judged criterion most teams will fail is *end-to-end thinking: does the
solution address the backend, infrastructure and processes, not just the
interface?*

> The reason a farmer's ₹2,000 is stuck is that **seven independent systems of
> record disagree and no one reconciles them on the citizen's behalf.** So the
> core of this product is a reconciliation engine over seven independently
> modelled, independently failing source systems — with a deterministic verdict,
> an idempotent case machine, and an escalation process modelled as code.

**The UI is the thin part.** The Mock Government Systems Layer and the Diagnosis
Engine are the product.

### 8.2 System context

```
┌──────────────────────────────────────────────────────────────────┐
│  CITIZEN DEVICE (₹7,000 Android, Chrome, 2G–4G, often shared)    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  NISHAN Web App (PWA)                                      │  │
│  │  · offline-first shell (service worker)                    │  │
│  │  · local case store (IndexedDB)                            │  │
│  │  · outbound action queue (idempotent, replayable)          │  │
│  │  · TTS via Web Speech API                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS / JSON
┌───────────────────────────────▼──────────────────────────────────┐
│  NISHAN APPLICATION SERVER                                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ Case Service │  │ Diagnosis Engine │  │ Escalation Service │  │
│  │ (state m/c)  │  │ (deterministic)  │  │ (SLA clocks)       │  │
│  └──────────────┘  └────────┬─────────┘  └────────────────────┘  │
│  ┌──────────────┐  ┌────────▼─────────┐  ┌────────────────────┐  │
│  │ Content      │  │ Source System    │  │ Narrative Service  │  │
│  │ Layer        │  │ Connectors       │  │ (DORMANT — see §9) │  │
│  └──────────────┘  └────────┬─────────┘  └────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│  MOCK GOVERNMENT SYSTEMS LAYER (MGSL) — synthetic, fault-injectable│
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ mUIDAI │ │ mPFMS  │ │ mNPCI  │ │ mLAND  │ │ mBANK  │ │ mITD │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └──────┘ │
│  + mSCHEME (beneficiary master, instalment calendar)             │
└──────────────────────────────────────────────────────────────────┘
```

**Nothing in this diagram touches a live government system.**

### 8.3 Technology

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript strict |
| Styling | Tailwind + CSS custom properties for tokens |
| State | React state + IndexedDB (idb-keyval) for offline |
| Offline | Service worker + custom outbox |
| Backend | Next.js Route Handlers (single deployable) |
| Persistence | SQLite (better-sqlite3) locally, Postgres in production |
| MGSL | Separate route namespace `/api/mock/*` with its own store and fault middleware |
| Hosting | Vercel + managed Postgres |
| TTS | Web Speech API |

**Do not add:** a component library, a state-management library, an ORM, dark
mode, or any third-party script on the primary path.

### 8.4 Mock Government Systems Layer

| Module | Models | Key fields | Failure modes |
|---|---|---|---|
| `mSCHEME` | PM-KISAN beneficiary master | reg_no, name, village, state, instalments[], status_string | stale record; duplicate family member |
| `mUIDAI` | Aadhaar demographic + auth | aadhaar_ref, name, dob, gender, linked_mobile, ekyc_state | mobile not linked; DOB mismatch; gender mismatch; name variance |
| `mPFMS` | Payment file processing | fto_id, fto_state, beneficiary_validation, govt_employee_flag | FTO generated but queued; validation flag set |
| `mNPCI` | Aadhaar→account mapper | aadhaar_ref, mapped_bank, mapper_state | inactive; mapped to different bank; lapsed via dormancy |
| `mLAND` | State land record | khata_id, owner_name, extent, acquired_on, seeded | name mismatch vs Aadhaar; acquired after 2019-02-01; not seeded |
| `mBANK` | Beneficiary bank account | account_ref, ifsc, account_state, credits[] | dormant; closed; wrong IFSC; credit present but unnoticed |
| `mITD` | Income tax payer status | pan_ref, is_taxpayer, assessment_year | flagged as taxpayer → exclusion |

**Deliberate inconsistency is the point.** Records are seeded so the *same*
person has different name spellings across `mUIDAI`, `mLAND` and `mBANK` —
because that is exactly what happens. The engine's job is to notice and name it.
Do not seed clean data and add faults later.

#### Fault injection

```ts
type FaultProfile = {
  latencyMs?: number;    // simulate 2G / loaded portal
  failureRate?: number;  // 0..1 random 5xx
  forceStatus?: number;  // deterministic failure for demo
  staleBy?: string;      // return a record as of an earlier timestamp
  timeout?: boolean;     // never respond
};
```

Controlled by the `X-NISHAN-Fault` header or a `?fault=` query param, and
surfaced in the UI as the **Demo Fault Switch**. This is how the reviewer sees
`INDETERMINATE` handling and offline recovery on demand — the single most
persuasive twenty seconds of the video.

#### The eight personas

| Persona | Blocker | Demo value |
|---|---|---|
| Lakshmi D. | B3 e-KYC, mobile unlinked | The canonical case; self-serve fix, but the OTP route is dead |
| Ramesh P. | B4 mapper inactive | "Money has nowhere to land" — the best explanation line |
| Sarala M. | B5 land name mismatch | Requires officer + grievance + SLA clock |
| Anbu K. | B6a in flight | Teaches that "not broken, just waiting" is an answer |
| Fatima B. | B6b rejected by bank | Failure + escalation |
| Govindan S. | B6c already credited | The counter-intuitive win: money was there all along |
| Murugan V. | B2 exclusion (taxpayer flag) | Contestable exclusion → evidence path |
| Selvi R. | B1 + B3 composite | Demonstrates precedence: one blocker shown, not two |

### 8.5 Diagnosis engine

```ts
diagnose(snapshot: SystemSnapshot, opts: { cycle, now }): Diagnosis

type Diagnosis = {
  primaryBlocker: BlockerCode;        // exactly one
  reason: ReasonCode;                 // the sub-cause — drives all content
  confidence: "certain" | "indeterminate";
  evidence: Evidence[];               // system, field, observed, expected, note
  facts: Record<string, string>;      // slot values for content templates
  portalStatus: string | null;        // the raw string, shown as secondary text
  secondaryObservations: BlockerCode[];
  unreachableSystems: SystemCode[];
  rulesetVersion: string;             // stamped on the case
  evaluatedAt: string;                // ISO
};
```

**Rules:**

- **Deterministic.** Same inputs → same output, always. **No LLM anywhere in this
  path, ever.**
- **Fixed precedence.** B1 → B2 → B3 → B4 → B5 → B6. First blocking rule wins,
  evaluation stops.
- **Evidence-carrying.** Every verdict names the system, the field, the value
  seen, the value required. This drives the Visit Slip and the grievance draft
  for free.
- **Partial-failure tolerant.** If a system needed to *rule out* a
  higher-precedence blocker is unreachable, return `INDETERMINATE` with what is
  known. **Never guess past a gap. Never fall through to a lower-precedence
  guess.**
- **Versioned.** The ruleset version is stamped on each case.

### 8.6 Case state machine

```
        DIAGNOSED
            │
            ├──► WAITING            (B6a: in flight — auto re-check on cycle)
            │        └──► RESOLVED_CREDITED
            │
            ├──► FIX_IN_PROGRESS    (self-serve or visit-required)
            │        ├──► FIX_DONE ──► AWAITING_NEXT_CYCLE ──► RESOLVED_CREDITED
            │        └──► FIX_FAILED ──► GRIEVANCE_DRAFTED
            │
            └──► GRIEVANCE_DRAFTED
                     └──► GRIEVANCE_FILED (T1)
                              ├── +15d ──► ESCALATED_T2
                              │                └── +15d ──► ESCALATED_T3
                              │                                 └──► CPGRAMS_SUGGESTED
                              ├──► RESOLVED_CREDITED     ✅ terminal success
                              └──► CLOSED_UNRESOLVED     ❌ displayed as failure
```

- `RESOLVED_CREDITED` is the **only** success terminal, and requires a matching
  credit in `mBANK`. A closed grievance without money renders as a failure with a
  "reopen" action.
- Every transition is an append-only event with
  `{ at, actor, from, to, reason, idempotency_key }`.
- Transitions are idempotent: replaying a queued action after reconnect is a
  no-op if already applied.

### 8.7 Idempotency and the offline outbox

```ts
type OutboxItem = {
  id: string;              // client-generated UUID = idempotency key
  endpoint: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  status: "pending" | "sent" | "confirmed" | "failed";
};
```

- Every mutating action is written to IndexedDB **before** any network attempt.
- The service worker replays pending items on `online`.
- The server stores `idempotency_key` with a unique constraint; a duplicate
  returns the original result rather than acting twice.
- The UI never shows "sent" until the server confirms; until then it shows
  **"Saved on your phone."**

**The duplicate-action guard** is the single most important user-facing
consequence. If a submission's outcome is unknown, the UI says:

> **"This was already submitted. Do not submit again."**
> *Your reference is NSH-4F2A. We'll keep checking.*

— rather than presenting an enabled button that invites a second grievance. This
is the direct inverse of the failure mode that makes citizens file three
complaints for one problem.

### 8.8 Database schema

```sql
CREATE TABLE cases (
  id                UUID PRIMARY KEY,
  reference         TEXT UNIQUE NOT NULL,          -- NSH-4F2A
  beneficiary_ref   TEXT NOT NULL,                 -- synthetic
  cycle             TEXT NOT NULL,                 -- '2026-23'
  state             TEXT NOT NULL,
  primary_blocker   TEXT,
  ruleset_version   TEXT NOT NULL,
  language          TEXT NOT NULL DEFAULT 'en',
  assisted          BOOLEAN NOT NULL DEFAULT FALSE,
  consent_id        UUID REFERENCES consents(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE case_events (
  id              BIGSERIAL PRIMARY KEY,
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor           TEXT NOT NULL,                   -- citizen|helper|system|mock_officer
  from_state      TEXT,
  to_state        TEXT,
  kind            TEXT NOT NULL,                   -- diagnosis|fix_step|grievance|escalation|credit
  detail          JSONB NOT NULL,
  idempotency_key TEXT UNIQUE
);

CREATE TABLE diagnoses (
  id              UUID PRIMARY KEY,
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  primary_blocker TEXT NOT NULL,
  confidence      TEXT NOT NULL,
  evidence        JSONB NOT NULL,
  unreachable     TEXT[] NOT NULL DEFAULT '{}',
  ruleset_version TEXT NOT NULL,
  evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grievances (
  id              UUID PRIMARY KEY,
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tier            SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 3),
  body            TEXT NOT NULL,
  filed_at        TIMESTAMPTZ,
  sla_due_at      TIMESTAMPTZ NOT NULL,
  escalated_at    TIMESTAMPTZ,
  simulated       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE consents (
  id              UUID PRIMARY KEY,
  granted_by      TEXT NOT NULL,                   -- 'beneficiary_declared_by_helper'
  helper_label    TEXT,
  scope           TEXT[] NOT NULL,
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_cases_reference   ON cases(reference);
CREATE INDEX idx_events_case_at    ON case_events(case_id, at DESC);
CREATE INDEX idx_grievance_sla     ON grievances(sla_due_at) WHERE filed_at IS NOT NULL;
```

**For the video's second minute:** the append-only `case_events` table means the
citizen's timeline and the audit trail are the *same object*. Nothing about the
case is reconstructed or inferred for display.

### 8.9 Escalation service

- On grievance filing, compute `sla_due_at` from tier policy (T1: 15 days;
  T2: +15; T3: +30).
- A scheduled job (hourly) selects grievances past due and appends an escalation
  event.
- **For the demo**, the same code path is exposed behind a **time-travel
  control**: "advance case by 15 days." Labelled as a demo control, not hidden.

---

## 9. The AI decision — read this before touching anything AI-related

### 9.1 Current position: THE LLM IS ABSENT — there is no narrative service

**Corrected 26 Aug 2026.** Earlier revisions of this document described a
complete, tested narrative service at `src/lib/narrative/service.ts` with four
call sites (`classifyIntent`, `explainBlocker`, `draftGrievance`,
`simplifyForSlip`), an `llmAvailable()` guard and a `NARRATIVE_MODE` flag.
**None of that exists in this repository. It was never built.**

Verified absent: no `lib/narrative/` directory, no `OPENAI_API_KEY` or
`NARRATIVE_MODE` reference anywhere in the tree, no model SDK in
`package.json`, and no network call of any kind outside Next.js itself.

**Status: NOT BUILT — and this is the preferred end state. Do not build it.**

The practical effect is that the honesty claim is *stronger* than the one this
document originally planned for, not weaker:

- Every sentence a user sees is resolved by `content/resolve.ts` from
  `content/catalogue.<locale>.json`. There is no other source of user-facing
  text in the build.
- No model can be accidentally enabled by setting an environment variable,
  because no code reads one.
- `/whats-real` can state without qualification that no language model runs —
  and unlike a dormant-but-present code path, that claim needs no test to defend
  it, because there is nothing to disable.

**Consequence for the video (§17, 1:15–1:30):** say "there is no language model
in this build," not "the language model is switched off." The first is simply
true and is the stronger line.

### 9.2 Hard rules — apply whether the model is on or off

**The LLM never, under any circumstances:**
- determines the blocker (deterministic engine only);
- asserts eligibility or ineligibility;
- predicts a payment date not derived from mock system data;
- claims any official, bank or officer has been contacted;
- produces anything framed as an official government determination.

**Permitted only if re-enabled:** translating and simplifying a *finding already
made*; drafting a grievance narrative from structured case facts only;
classifying free text into a fixed intent set; shortening fix steps for a slip.

### 9.3 Guards — SPECIFIED, NOT BUILT

**Corrected 26 Aug 2026.** This section previously read "guards already
implemented — do not remove them." None of the functions below exist in the
tree: there is no `numbersAreGrounded()`, `containsSystemJargon()`, or
`asData()`. They were specified for a narrative service that was never built
(§9.1). Nothing needs removing, and nothing needs writing while §9.1 holds.

Retained here as the binding contract **if** anyone ever re-opens the question:
building any one of these call sites without all of these guards is out of scope
and off-spec.

- **Structured outputs only.** Response must validate against a JSON schema or
  the fallback is used.
- **`numbersAreGrounded()`** — every number token in model output must appear in
  the input. A hallucinated registration number on a document someone carries to
  a government office is the failure mode that actually matters.
- **`containsSystemJargon()`** — a rewrite that reintroduces `npci|fto|mapper|
  seeding|dbt|pfms|rft` has failed at its only job and is rejected.
- **Step-count check** on `simplifyForSlip` — a dropped step is a wasted journey.
- **`asData()`** — user free text is delimited and declared to be data, never
  instruction. The model holds no tools and touches no database. Worst case if
  injection succeeds: a badly-worded draft the user reads and edits before filing.
- **Cache** keyed on `reason × language × rulesetVersion` — a small, finite set.

### 9.4 Voice and face auth — Stage 2, not now

**Voice is not an LLM** and remains architecturally welcome:

| Layer | Technology | Deterministic? |
|---|---|---|
| Speech → text | Bhashini ASR | Transcription, not inference |
| Intent → route | Fixed keyword classifier (**not yet built** — no `classifyIntentLocal` in tree) | Yes |
| Diagnosis | B1→B6 engine | Yes |
| Text → speech | Bhashini TTS reading catalogue strings | Yes |

For Stage 1: render a **prominent, visually disabled microphone button** with a
caption naming Bhashini. It must not request microphone permission, must not
import a speech library, and must have no handler beyond a no-op.

**WebRTC in-browser face auth** (answering P7/P10 — no forced app download) is
described on `/whats-real` as planned. Build it **only** if the terminal success
state already works and you are ahead of schedule. It is on the cut list (§15).

---

## 10. Content layer

Every user-facing string comes from a keyed content table and is resolved through
a slot-filler. **Zero hardcoded user-facing text in JSX.** This is what makes the
no-AI claim auditable, and it is non-negotiable.

### 10.1 Structure

**Actual layout (verified 26 Aug 2026).** There is no `src/` directory. The
content layer lives at the repository root:

```
content/catalogue.en.json    all user-facing strings, English      — BUILT (79 keys)
content/catalogue.hi.json    all user-facing strings, Hindi        — BUILT (79 keys)
content/catalogue.ta.json    all user-facing strings, Tamil        — KEYS ONLY, values are TODO_TA: placeholders
content/statusCodes.json     status code → cause/action/owner/SLA  — BUILT (8 codes)
content/resolve.ts           the slot-filler                        — BUILT
lib/content.ts               CatalogueKey / Locale / Slots types     — BUILT
```

`verdicts.ts` and `fixPaths.ts` **do not exist and never did.** Their two jobs
are currently split differently from the original plan:

| Planned file | What actually serves that purpose today | Gap |
|---|---|---|
| `verdicts.ts` — sentence + "why" per ReasonCode | `content/catalogue.*.json` keys `cause.*`, plus `content/statusCodes.json` for the code→cause mapping | No "why" text at all; keyed on an ad-hoc status code, not `ReasonCode` |
| `verdicts.ts` — `RAIL_GATES` | `GATE_KEYS` inlined in `components/MoneyRail.tsx` | In a component, not the content layer; 8 gates, not the 7 in §11.2 |
| `fixPaths.ts` — ordered steps, authority, carry list, routes | `catalogue` keys `action.*` / `owner.*`, plus a fixed 3-item `components/ActionChecklist.tsx` | **No Fix Path model exists.** No routes, no `available`/`unavailableBecause`, no carry list, no effect windows. §10.4 is entirely unbuilt. |

Content **should** be keyed on `ReasonCode`, not `BlockerCode` — the sub-cause is
what makes the sentence true. **It currently is not**: `statusCodes.json` is
keyed on ad-hoc strings (`EKYC_OTP_UNAVAILABLE`, `NPCI_UNMAPPED`) that do not
match the `ReasonCode` set in §7.3. Reconciling those two lists is unstarted
work, not a done thing.

### 10.2 Languages

`en` · `ta` (Tamil) · `hi` (Hindi) — all three, across the entire primary path.
Tamil is not an afterthought: the canonical persona is a Tamil speaker and the
entry screen leads in Tamil.

### 10.3 Slot filling

```ts
render(template, facts)   // "{amount}" → "2,000"; unknown slot → "—", never a crash
```

Tests assert no unfilled `{slot}` ever reaches a rendered sentence, in any
language, for any persona.

### 10.4 Fix Paths

Every blocker resolves to exactly one Fix Path, which knows three things the
portal never tells anyone:

1. **Who can actually fix this.** The central helpline cannot fix land seeding.
   Sending someone to the wrong counter costs a day's wage and a bus fare — the
   real cost of a vague answer.
2. **Which route will work for this person.** Routes carry
   `available: boolean` and `unavailableBecause` — an impossible route is shown
   *ruled out with the reason*, never hidden silently.
3. **Whether an officer is required** — which decides whether the case gets a
   grievance and an SLA clock, or just a checklist.

Authorities are **roles, never named individuals**: `SELF_ONLINE`, `CSC`,
`BANK_BRANCH`, `VILLAGE_REVENUE_OFFICER`, `BLOCK_AGRICULTURE_OFFICER`,
`DISTRICT_AGRICULTURE_OFFICER`, `STATE_NODAL_OFFICER`.

### 10.5 Copy rules — enforced by tests

- Name things by what the person controls, never by how the system is built.
  *"Your bank has not linked your Aadhaar"* — never *"NPCI mapper inactive."*
- **No system vocabulary in primary copy.** `npci|fto|mapper|seeding|dbt|pfms|rft`
  are forbidden in any farmer-facing sentence, in any language.
- One idea per screen. The primary answer is the largest thing on it.
- Buttons say what happens: "Check my payment", "Print this slip", "Send my
  complaint." The name of an action does not change mid-flow.
- Errors state what happened and what to do. They never apologise and are never
  vague.
  - ✗ "Something went wrong. Please try again later."
  - ✓ "We couldn't reach the land records system. Your case is saved. Try again,
    or continue — we'll check automatically."
- Numbers are always concrete: a date, a rupee amount, a day count. Never "soon."
- Every wait states what happens when it ends and what happens if it does not.

---

## 11. Frontend specification

### 11.1 Design thesis

The subject's world is **the ledger**: the bank passbook line, the village land
record, the stamped receipt, the queue at the block office. **Not "agriculture"**
— no wheat sheaves, no green gradients, no farmer-in-a-field photography. Those
are decoration about farming; this product is about **money that has a location
and won't move.**

The visual language is a **transit record**: a thing moving through numbered
custody points, stamped at each, currently stopped at one.

### 11.2 The signature element — The Money Rail

```
  ●  Scheme approved you                  ✓  20 Jun
  │
  ●  Your state signed the request        ✓  21 Jun
  │
  ●  Payment file created                 ✓  22 Jun
  │
  ╪══ ▓▓  YOUR ₹2,000 IS HERE  ▓▓            ◀── marker
  │      Your bank hasn't linked
  │      your Aadhaar to your account
  │
  ○  Bank credits your account            —
  │
  ○  Money in your hand                   —
```

**Seven gates, in pipeline order.** Target home is a `RAIL_GATES` export in the
content layer; **today they are an 8-entry `GATE_KEYS` array inlined in
`components/MoneyRail.tsx`**, with different labels from the table below. The
table below is the specification; the component does not yet match it.

| # | Gate | Label (EN) |
|---|---|---|
| 1 | `REGISTERED` | Scheme approved you |
| 2 | `ELIGIBLE` | Eligibility checked |
| 3 | `IDENTITY_VERIFIED` | Identity check done |
| 4 | `STATE_SIGNED` | Your state signed the request |
| 5 | `PAYMENT_FILE` | Payment file created |
| 6 | `BANK_LINKED` | Aadhaar linked to your account |
| 7 | `CREDITED` | Bank credited your account |

**Rail order ≠ rule precedence, deliberately.** B4 is *evaluated* before B5
because an unpayable account is the more actionable of the two, but on the rail
the state gate sits earlier because that is where the money physically stops.
`stoppedAt(blocker)` maps blocker → gate; the marker sits immediately before the
shut gate.

**Why not a status dashboard of six flags:** because that is the current portal's
failure restated prettily. The rail encodes a truth the flags don't — that these
are *sequential gates*, that everything before the stop point already worked, and
that exactly one thing is in the way. It also makes B6c land emotionally: the
marker sits at the bottom in `--cleared`, and the answer is "your money arrived on
24 June; check the account ending 4471."

**This is the one memorable thing. Everything else on screen is quiet.**

### 11.3 Design tokens — colour

**Replaced 27 Aug 2026.** The previous ink-blue / ledger-paper / rubber-stamp
palette is withdrawn in full. The palette below is the theme: a screenshot of any
screen should read as these five colours.

#### Theme colours — what the product looks like

| Token | Hex | Role |
|---|---|---|
| `--teal-deep` | `#00796B` | Primary. Header band, primary buttons, the rail line, the money marker. |
| `--green` | `#4CAF50` | Cleared gates, credited state, success |
| `--green-soft` | `#A5D6A7` | Passed-gate fills, quiet success backgrounds |
| `--cyan-pale` | `#E0F7FA` | Page background, card wells, section separation |
| `--white` | `#FFFFFF` | Card surfaces |

#### Functional additions — not theme colours

Each has exactly one job and appears **only when that job is on screen**. Never
decorative, never a background, never used to add visual interest.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#10241F` | Body text. Teal-cast near-black, so it sits inside the family rather than fighting it. |
| `--ink-soft` | `#486B64` | Secondary text and labels **only**. Never body copy. |
| `--stop` | `#C62828` | **The blocked gate and nothing else.** At most once per screen. If two things are red, the screen has failed. |
| `--pending` | `#EF6C00` | In-flight state, SLA countdown, offline strip. Only when one of those three is actually present. |
| `--rule` | `#B2DFDB` | Hairlines, dividers, inactive rail segments |
| `--focus` | `#00796B` | Focus ring, 3px, offset 2px. Reuses the theme teal. |

Practical consequence: most screens show only the five theme colours plus `--ink`
for text. `--stop` appears on the diagnosis screen when a gate is blocked, and
nowhere else in the product. `--pending` appears only while something is
genuinely waiting or offline.

No dark mode. No gradients. Green is structural, not an atmospheric wash.

#### Measured contrast — binding usage rules

§11.9 requires **7:1 for body text**. These ratios are computed, not estimated,
and the showcase route at `/demo/tokens` renders them live. The rules below are
what make this palette compliant; they are not advisory.

| Pair | Ratio | Verdict |
|---|---|---|
| `--ink` on `--white` | **16.23** | Body text. Use this by default. |
| `--ink` on `--cyan-pale` | **14.57** | Body text on the page background. |
| `--ink` on `--green-soft` | **9.87** | Passes body. |
| `--ink` on `--green` | 5.84 | AA only — never body copy. |
| `--ink` on `--pending` | 5.27 | AA only — the **only** legible text on `--pending`. |
| `--ink-soft` on `--white` | 5.89 | AA only. This is why `--ink-soft` is barred from body copy. |
| `--white` on `--teal-deep` | 5.32 | AA. Fails 7:1 — see rule 2. |
| `--white` on `--stop` | 5.62 | AA. Large/UI text only. |
| `--white` on `--green` | **2.78** | Fails everything, including the 3:1 non-text floor. |
| `--white` on `--pending` | **3.08** | Fails normal text. Never use. |
| `--rule` on `--cyan-pale` | **1.30** | Effectively invisible — see rule 4. |

1. **`--green` and `--green-soft` are fills only.** Never text, and no white
   glyph on them either — white-on-`--green` is 2.78:1, below the 3:1 floor for
   graphical objects. **A check mark on a passed gate is drawn in `--ink`**
   (5.84:1), not white.
2. **No body copy on `--teal-deep`.** White on teal is 5.32:1, under the 7:1 body
   requirement. It is fine for the header band, button labels and other large or
   UI-weight text (≥18px semibold clears AAA-large at 4.5:1). Body paragraphs go
   on `--white` or `--cyan-pale`.
3. **`--pending` is a fill, never a text colour.** Orange text on white is 3.08:1
   and on `--cyan-pale` 2.77:1 — both fail. When `--pending` is on screen it is a
   background carrying `--ink` text.
4. **`--rule` hairlines only read on `--white`.** At 1.30:1 against
   `--cyan-pale` they vanish. On the page background, separate sections with the
   background/card boundary itself, not a `--rule` line.
5. **Every state carries an icon plus a text label.** Colour never carries
   meaning alone — this is §11.8, and it is what makes the AA-only pairs
   acceptable: none of them is the sole signal.

#### Money Rail colour mapping

| Element | Treatment |
|---|---|
| Passed gate | `--green` fill, `--ink` check (see rule 1), `--ink-soft` label |
| Blocked gate | `--stop`, drawn shut |
| Unreached gate | `--rule` outline, `--ink-soft` label, no fill |
| Money marker | `--teal-deep` fill, `--white` text. The only `999px` radius in the UI. |
| Rail line | `--teal-deep` above the block, `--rule` below it |

### 11.4 Typography

| Role | Face | Why |
|---|---|---|
| Display / body | **Anek Latin** (variable) | One variable family across every text role. Anek is designed for cross-script parity, so adding the Tamil and Devanagari cuts later is a drop-in, not a redesign. |
| Data | **IBM Plex Mono** | Reference numbers, amounts, dates, and the raw portal status string. Monospace signals "this is a record, not prose" — the passbook logic. |

**Latin only in this build.** `Anek Tamil` and `Anek Devanagari` are **not**
loaded. This is a font-loading decision, not a language decision: §10.2 still
requires en / ta / hi across the primary path, and the catalogues still ship
three locales. Until the Tamil and Devanagari cuts are added, those two locales
render in a system fallback face and will not match the Latin rhythm — which is
the exact degradation the original §11.4 rationale warned about. **Adding
`Anek Devanagari` and `Anek Tamil` is a prerequisite for shipping ta/hi as
finished work**, and is recorded as such in §13.

| Token | Size / line-height | Use |
|---|---|---|
| `--t-answer` | 30px / 1.2, weight 600 | The one-sentence verdict. Largest thing on the page. |
| `--t-head` | 22px / 1.3, weight 600 | Screen titles |
| `--t-body` | 18px / 1.55, weight 400 | Everything readable. **Never below 18px.** |
| `--t-label` | 15px / 1.4, weight 500, tracking 0.02em | Rail labels, field labels |
| `--t-data` | 17px / 1.4, IBM Plex Mono | References, amounts, dates |

### 11.5 Space, shape, motion

- 4px base scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Radius `2px` on cards and inputs; `999px` on the rail marker **only**.
  Near-square corners read as *document*; the single round element is the money.
- Touch targets **≥ 56px** for primary actions, **≥ 48px** for everything else.
  Primary action pinned to the bottom of the viewport for thumb reach.
- **One orchestrated motion only** — the rail marker settling into position on the
  diagnosis screen (400ms, ease-out, shut gate drawing after it). Everything else
  is instant. `prefers-reduced-motion` removes it and renders the final state.

### 11.6 Screen inventory

| # | Route | Screen | Priority |
|---|---|---|---|
| S1 | `/` | Entry — the question | P0 |
| S2 | `/who` | Identify | P0 |
| S3 | `/who/verify` | Simulated OTP | P0 |
| S4 | `/case/:ref` | **Diagnosis — the Money Rail** | P0 |
| S5 | `/case/:ref/why` | Explanation detail | P1 |
| S6 | `/case/:ref/fix` | Fix Path | P0 |
| S7 | `/case/:ref/fix/slip` | Visit Slip (printable) | P0 |
| S8 | `/case/:ref/complaint` | Grievance draft & file | P0 |
| S9 | `/case/:ref/timeline` | Case timeline & SLA | P0 |
| S10 | `/whats-real` | Disclosure | P0 |
| S11 | `/demo` | Persona picker + fault switch + time travel | P0 |

Viewport target **360–414px primary**. Desktop is a scaled-up phone, not a
separate design.

### 11.7 Screen detail

**S1 — Entry (`/`)** · *Job: make a person who cannot read English understand, in
three seconds, that this answers one question — and start.*

Language switch on first paint (48px targets). The proposition as the headline in
`--t-answer`. Disabled mic button with Bhashini caption. Four large tap choices:
"My instalment did not come" / "I don't know if I'm registered" / "My e-KYC is
showing as pending" / "I'm checking for someone else" (assisted-mode entry).
Footer link to `/whats-real`. **No captcha, no login, no scroll to reach the
primary action.** Language switch changes every string including the headline.

> Deliberate risk kept: the entry headline is a question in Tamil, not a product
> name. A visitor who reads no Tamil sees an unfamiliar script first. That is
> correct — the product is for the person who reads it, and the language switch is
> directly above it.

**S2 — Identify (`/who`)** · Three tabs of equal weight: **Aadhaar** · **Mobile** ·
**Registration number**. Aadhaar default. Under each, "Don't have this?" switches
to an alternative — **never a dead end** (P2). `inputmode="numeric"`. Digit
grouping as you type. Assisted mode shows a consent panel above the fields:
*"You're checking on behalf of someone else. Confirm they've asked you to do this.
Your name will be recorded on the case."* Field: *your name or role*. Checkbox:
*"They asked me to check this."* Demo build: "Use a demo person" → S11.

**S3 — Verify (`/who/verify`)** · Six-box OTP, autofocus, paste-friendly.
In-place disclosure **directly under the field**: *"This is a simulated code. No
message has been sent to any phone. Use 1234 56."* "Didn't get the code?" explains
the real-world cause (mobile not linked to Aadhaar) and offers the other routes —
because that dead end is precisely B3's signature (P3, P7).

**S4 — Diagnosis (`/case/:ref`)** · *This screen is 60% of the demo.*

- Verdict sentence is the **largest text on the page and appears above the rail**.
  The rail is evidence for a claim already made, not a puzzle to solve.
- 🔊 Listen control, 48px, always present.
- Exactly one `--stamp` element.
- Raw portal status string as small mono text — deliberately, so the farmer can
  match what she saw on the official site and trust we mean the same case.
- `INDETERMINATE` variant: dashed-outline marker at the last known gate; copy is
  "We can't reach one of the government systems right now. Here's what we do
  know." Retry button. **Never a fabricated verdict.**
- B6c variant: marker at the bottom gate in `--cleared`; headline becomes the
  credit sentence; primary action becomes "How to check your passbook."
- Primary action pinned bottom: "Fix this →".

**S5 — Why (`/case/:ref/why`)** · Two or three plain sentences on why this happens
generally, plus evidence in a small mono table: system, field, what it says, what
it should say. Reader-optional; S4 must stand alone without it.

**S6 — Fix Path (`/case/:ref/fix`)** · Ordered checkable steps, state persists.
Self-serve blockers complete **inline** — the e-KYC path runs a simulated OTP
right here and the user never leaves (P10). Visit-required blockers show a compact
card: **who** (role, not a name), **where**, **what to carry**, **what to say**.
Each step shows expected time-to-effect. Progress states the resumability promise
in words: **"Step 2 of 4 · saved on your phone."** Where more than one route
exists, the recommended one is expanded and the others collapsed under "Other ways
to do this" — **with the reason stated**: *"OTP won't work for you because your
Aadhaar isn't linked to this mobile number."*

**S7 — Visit Slip (`/case/:ref/fix/slip`)** · Print-optimised (`@media print`),
designed as a physical artifact. Case reference in large mono at the top.
Beneficiary name, village, registration number. The blocker in one sentence, in
the local language **and** English (the officer may prefer English). The exact
request: *"Please seed this Aadhaar number to account MOCKACC-4471 in the NPCI
mapper."* Documents to carry as a checklist with printed boxes. Blank space
labelled **"Officer's note"** — because a slip that gets written on gets kept.
Footer disclaimer. Also emits a WhatsApp/SMS-safe plain-text version.

**S8 — Grievance (`/case/:ref/complaint`)** · Draft shown **before** filing, in the
user's language, editable. Above it, a **"facts included" chip row** — instalment,
release date, portal status, e-KYC state, seeding state, registration number,
steps taken. Each chip is a fact pulled from the case, not typed by the user. This
visibly demonstrates why this complaint is stronger than one a farmer could write
(§3.7). Routing shown plainly: *"This goes to your Block Agriculture Officer first.
If there's no answer in 15 days, it moves up to the State Nodal Officer
automatically."* **At the file button, in place:** *"This complaint is not sent to
any government office. In a real deployment it would go to your State Nodal
Officer."* After filing: reference number, expected-by date in large type, one
sentence on what happens if that date passes.

**S9 — Timeline (`/case/:ref/timeline`)** · Reverse-chronological events from
`case_events` — the same rows that form the audit trail. Each entry: date, what
happened, who did it (citizen / helper / system / office). SLA clock as a
**days-remaining count, not a progress bar**: "11 days left before this moves up
automatically." Terminal states styled distinctly: `RESOLVED_CREDITED` in
`--cleared` with amount and date; `CLOSED_UNRESOLVED` in `--stamp` with "Reopen
this."

**S10 — What's real (`/whats-real`)** · §12.2 table rendered plainly. Plus "Delete
this case." Linked from every screen footer. No apologetic tone — it reads as a
spec sheet.

**S11 — Demo controls (`/demo`)** · Visibly a demo surface, not part of the citizen
product. Persona picker (8 cards, each naming the blocker it demonstrates). Fault
switch ("Break the network" / "Make a government system slow" / "Make a government
system unreachable"). Time travel ("Advance this case by 15 days").

### 11.8 Cross-cutting behaviours

**Connection states**

| State | UI |
|---|---|
| Online | No indicator. Silence is the correct signal. |
| Offline | Persistent strip: **"You're offline. Everything is saved on your phone."** `--pending` |
| Queued action | Inline: "Saved. Will send when you're back online." |
| Reconnecting | "Sending your saved actions…" then silence |
| Unknown outcome | **"This was already submitted. Do not submit again."** Button disabled, reference shown. |

**Voice-out** · Every screen with a verdict, instruction or error has a 🔊 control
reading the primary content in the selected language. Not hidden in a menu.
Browser TTS, with pre-generated audio fallback for the canonical verdict strings.

**Language** · Three languages across the entire primary path. Switching never
loses position or state. Numerals in Latin digits in all languages (what the
passbook and the SMS use). **Test every button at the longest string, not the
English one** — Tamil words are longer.

**Quality floor** · Responsive to 320px. Visible keyboard focus using `--focus`.
Reduced motion respected. Every state distinguishable without colour (icon + text
label always accompany `--stamp`/`--cleared`/`--pending`). Semantic headings in
order. Form labels bound to inputs. `lang` attribute set per language so screen
readers pronounce Tamil and Hindi properly.

### 11.9 Performance budget

| Metric | Budget |
|---|---|
| FCP on simulated 3G | < 2s |
| Primary-path JS | ≤ 150KB gzipped |
| Fonts | 3 subsets, `font-display: swap`, preloaded for the active language only |
| Images | **None on the primary path.** The rail is SVG/CSS. |
| Third-party scripts | Zero |
| Diagnosis response (all systems healthy) | < 400ms p95 |

The absence of imagery is a design decision, not a shortcut: photographs are the
first thing to fail on a slow connection, and the rail carries the meaning better
than any photo would.

### 11.10 Already cut — do not reintroduce

- **A six-flag status grid** alongside the rail. It was the old portal's
  information architecture wearing new clothes, and it violated "one cause, one
  action."
- **An illustrated farmer avatar** on the entry screen. Decoration about farming,
  not about the problem, and it costs bytes on 2G.
- **A progress bar for the SLA clock.** A bar implies smooth progress toward a
  guaranteed outcome; a countdown states a commitment and makes its breach
  visible. The number is the honest control.

---

## 12. Security, honesty and disclosure

### 12.1 Governing principles

1. **No live government system is contacted, probed, tested or scraped.** Ever.
   Not in development, not in the demo, not "just to check."
2. **No real personal data enters the system** — including the team's own.
3. **Data we do not need, we do not collect.**
4. **Disclosure is in-place, not in a footer.** A user must never be able to
   mistake this for the official service at any point in the journey.
5. **The trust model assumes the helper, not the beneficiary, is holding the
   phone.**

### 12.2 The `/whats-real` table

| Component | Status | Notes |
|---|---|---|
| Diagnosis engine | **Real** | Deterministic rules, fully implemented |
| Case state machine, event log, SLA clocks | **Real** | Real database, real transitions |
| Offline queue and idempotency | **Real** | Works; try airplane mode |
| Language and text-to-speech | **Real** | Browser TTS; three languages |
| **AI / language model** | **Not used** | No model runs in this build. Every sentence is a pre-authored, versioned string. The code path exists and is disabled. |
| Aadhaar / UIDAI | **Simulated** | No real Aadhaar system contacted |
| PFMS, NPCI, Income Tax, land records, bank | **Simulated** | Synthetic modules with injectable faults |
| OTP | **Simulated** | No SMS is sent |
| Grievance filing | **Simulated** | Nothing is submitted to any government system |
| Beneficiary data | **Synthetic** | Eight fictional personas |
| Voice input (Bhashini) | **Planned** | Button visible, disabled. Stage 2. |
| In-browser face auth (WebRTC) | **Planned** | Described, not shipped. Stage 2. |
| Time travel / fault switch | **Demo controls** | Clearly labelled; not part of a real deployment |

### 12.3 Synthetic identifier formats

Structurally invalid as real credentials, so they cannot be mistaken for or reused
as real ones:

| Type | Format | Note |
|---|---|---|
| Aadhaar-like | `9999 XXXX XXXX` | Fails real Verhoeff checksum by construction |
| Mobile | `+91 5XXXXXXXXX` | 5-series is not an allocated Indian mobile series |
| Bank account | `MOCKACC-####` | Non-numeric, cannot be pasted anywhere real |
| IFSC | `MOCK0000001` | Not a real bank code |
| PAN-like | `MOCKP0000M` | Structurally invalid |
| Registration number | `NSHDEMO-####` | Namespaced to the prototype |
| Case reference | `NSH-XXXX` | Ours; not a government reference format |

**Never generate synthetic data that mimics a real, identifiable individual** — no
real village + real name combinations pulled from public beneficiary lists, even
though those lists are publicly downloadable. Public availability is not consent.

Persona names are fictional and labelled as such on the picker: *"These are
made-up people. Any resemblance to a real beneficiary is coincidental."*

### 12.4 Access control — three modes

| Mode | Who | How established | What is visible |
|---|---|---|---|
| **Self** | The beneficiary | Simulated OTP to the record's mobile | Full case |
| **Assisted** | Helper acting for the beneficiary | Explicit consent declaration, recorded with helper label and timestamp; simulated OTP still required | Full case, every action attributed to the helper in the timeline |
| **Reference** | Anyone holding the case reference | Case reference `NSH-XXXX` only | **Status and next step only** — no identifiers, no bank details, no full address |

**Reference mode is deliberately thin.** It exists so a helper can WhatsApp a
reference to the beneficiary — but it must never leak identity data, because a
short reference is guessable.

Consent expires after 24 hours. Scope is enumerated, not blanket:
`["view_status","start_fix","file_grievance"]`. The timeline shows who did what:
*"Complaint drafted by helper (Karthik) on behalf of beneficiary."*

**Why this matters for judging:** proxy usage is universal in Indian scheme access
and universally undesigned-for (P11). Building it as a first-class, auditable mode
demonstrates end-to-end thinking about *process*, not just interface.

### 12.5 Data collected, retained, deleted

**Collected:** selected persona reference (session + case lifetime); case state and
events (30 days then purged); language preference (localStorage only); consent
record (case lifetime); anonymous error logs (7 days, no identifiers).

**Not collected:** accounts, passwords, email, real phone numbers, location,
device fingerprinting, third-party analytics, session recording.

**Deletion:** `/whats-real` has a "Delete this case" control that hard-deletes the
case and all events and clears local storage. Automatic purge at 30 days. Because
there are no accounts, there is no orphaned identity.

### 12.6 Application security controls

- HTTPS only; HSTS. CSP with no `unsafe-inline` script; strict `connect-src`
  allowlist. `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  denying camera, geolocation and microphone.
- All API inputs validated with Zod at the boundary; reject on failure with a
  typed error.
- **Parameterised SQL only.** No string-built queries anywhere.
- Case reference lookups rate-limited and **not** enumerable to identity data.

| Endpoint | Limit |
|---|---|
| `/api/diagnose` | 20 / 10 min / IP |
| `/api/case/:reference` | 10 / min / IP; exponential backoff after 3 misses |
| MGSL endpoints | Not publicly routable except through the app |

- API keys in environment variables only; never in client bundles, never in the
  repository. `.env.example` committed with placeholders; `.env` gitignored.
  Pre-commit secret scan (gitleaks).
- Lockfile committed. No dependency added on the final day without a recorded
  reason.
- Fonts and icons: open-licence only (Anek / Noto — SIL OFL; IBM Plex — OFL).
  License files retained. All copy original.

### 12.7 In-place disclosure at high-risk moments

- **OTP screen:** "This is a simulated code. No message has been sent to any
  phone."
- **Grievance filing:** "This complaint is not sent to any government office. In a
  real deployment it would go to your State Nodal Officer."
- **Persistent banner, non-dismissible, every screen:** "Prototype — not the
  official PM-KISAN service. All data is made up."

### 12.8 Known limitations — stated, not hidden

1. No real integration. Real deployment would require sanctioned API access from
   the Department of Agriculture & Farmers Welfare and state agriculture
   departments.
2. Blocker taxonomy is derived from public documentation, not operational data.
3. Land-record semantics vary by state; the prototype models one generic state.
4. Three languages only; real deployment needs the full set via Bhashini.
5. No SMS/IVR channel, which the least-connected users would need most.
6. Escalation is simulated; real escalation requires officer-side workflow
   integration.
7. The prototype cannot verify whether an officer acted — only whether money
   arrived in the mock bank record.

### 12.9 Incident procedure

| Event | Action |
|---|---|
| Secret committed | Rotate key immediately; force-push removal; note in build log |
| Real personal data entered | Delete the case, purge logs, confirm in writing |
| Any accidental request to a government host | Stop, remove the code path, document it, disclose in `/whats-real` |
| Production link down near deadline | Roll back to last known-good deploy. **Do not fix-forward inside the final two hours.** |

---

## 13. Build status — audited against the tree on 26 August 2026

**This section was rewritten from a file-by-file audit, replacing an inherited
list that was substantially wrong.** The previous §13.1 claimed as "done — do not
rebuild" a diagnosis engine, seven mock systems, eight personas, fault injection,
Fix Paths, a narrative service and a 28-test suite. **None of those exist.** Each
entry below was verified by reading the file named.

Read this section pessimistically. Where something is half-present it is listed
in §13.2, not §13.1, however close it looks.

### 13.1 Verified present and working

| Thing | File(s) | Verified by |
|---|---|---|
| Next.js 14 App Router scaffold, TypeScript `strict: true`, Tailwind 3 | `package.json`, `tsconfig.json`, `next.config.mjs` | `npx tsc --noEmit` passes clean |
| Four routes that render | `app/page.tsx`, `app/assisted/page.tsx`, `app/case/[id]/page.tsx`, `app/whats-real/page.tsx` | dev server; all four return 200 |
| Content catalogue, English + Hindi | `content/catalogue.en.json`, `content/catalogue.hi.json` | 79 keys each, key sets **identical** (diffed programmatically) |
| Slot-filling resolver with English fallback | `content/resolve.ts` | substitutes `{slot}`, falls back to `en` when a locale lacks a key |
| Content typing derived from the catalogue | `lib/content.ts` | `CatalogueKey` is `keyof typeof en`, so a mistyped key is a compile error |
| **Zero hardcoded user-facing English in JSX** (§16.4) | all 4 pages, all 13 components | every visible string goes through `resolve()`; two punctuation-only exceptions noted in §13.2 |
| Money Rail renders, with marker and three gate states | `components/MoneyRail.tsx`, `RailGate.tsx`, `MoneyMarker.tsx` | renders from `data/sample-case.json` |
| Gate state is distinguishable without colour (§11.8) | `components/RailGate.tsx` | each gate prints a text state label as well as a colour |
| Marker motion honours `prefers-reduced-motion` (§11.5) | `app/globals.css` | `.rail-marker` animation disabled under the media query |
| Disabled mic button, exactly as §9.4 requires | `components/MicButton.tsx` | `disabled`, `aria-disabled`, no-op handler, no permission request, no speech library imported, Bhashini named in the caption |
| Language provider and toggle | `components/LocaleProvider.tsx`, `LanguageToggle.tsx` | switches locale, `aria-pressed` set |
| Status-code → cause/action/owner/SLA mapping | `content/statusCodes.json` | 8 codes, each pointing at catalogue keys |
| Package already renamed | `package.json` | name is `pm-kisan-nishan`; no `PKH` or `Paisa Kahan Hai` string anywhere in source |

### 13.2 Present but stubbed or incomplete

**These files exist and will mislead you if you trust the filename.**

| Thing | File | What is actually there |
|---|---|---|
| **Diagnosis engine** | `engine/diagnose.ts` | **A stub that throws.** `diagnoseCase()` is six lines ending in `throw new Error("Diagnosis engine is not implemented in this scaffold.")`. No rules, no evidence, no `INDETERMINATE`. Signature is `diagnoseCase(Case): Verdict`, not the `diagnose(snapshot, opts): Diagnosis` of §8.5. |
| Blocker precedence | `engine/precedence.ts` | The array `["B1".."B6"]` and nothing else. Correct, but nothing consumes it. |
| **Seven mock systems** | `mocks/index.ts` | **All stubs.** `readMockSystem()` returns `null` unconditionally. The seven named exports each call it with an empty reference id. No fixture data, no per-system fields, no failure modes. |
| Government record types | `lib/types/systems.ts` | Seven interfaces that all extend one generic PASS/FAIL/UNKNOWN shape and add **no fields**. None of the §8.4 fields (`aadhaar_ref`, `mapper_state`, `khata_id`, `credits[]`) exist. |
| Case and verdict types | `lib/types/case.ts`, `lib/types/blocker.ts` | `Verdict` has 3 fields; the §8.5 `Diagnosis` needs 10 — no `evidence`, `facts`, `confidence`, `unreachableSystems`, `rulesetVersion`, `portalStatus`. `CaseState` has 4 states; §8.6 needs 12. |
| Database schema | `db/schema.sql` | 4 tables, marked `TODO(db)`. Diverges from §8.8: no `diagnoses`, no `grievances`, no `consents` with `scope`/`expires_at`, no `reference`, no `sla_due_at`, no `ruleset_version`, no `language`/`assisted`. **Never executed — there is no database connection anywhere in the tree.** |
| Money Rail gates | `components/MoneyRail.tsx` | **8 gates, not the 7 in §11.2**, with different labels (`rail.aadhaar`, `rail.exclusion`, `rail.treasury`). `GATE_KEYS` is inlined in the component instead of living in the content layer. No `stoppedAt()` mapping exists — the blocked index comes from a literal array in the sample JSON. |
| Blocker taxonomy in content | `content/statusCodes.json` | **Contradicts §7.2.** It maps `AADHAAR_NOT_SEEDED` to B2 (§7.2 says B4), `LAND_MISMATCH` to B4 (§7.2 says B5), `NPCI_UNMAPPED` to B5 (§7.2 says B4), and `ITD_EXCLUDED` to B6 (§7.2 says B2). Its 8 code strings are also not the `ReasonCode` set in §7.3. **Two incompatible taxonomies are live in the repo.** |
| Case screen | `app/case/[id]/page.tsx` | Renders one hardcoded case only; any other id returns "not found". Reads `data/sample-case.json` directly and **never calls the engine**. |
| Assisted mode | `app/assisted/page.tsx` | Consent checkbox held in `useState` and discarded on reload. No helper-label field, no timestamp, no scope, nothing persisted. §12.4's recorded consent is not implemented. |
| `/whats-real` | `app/whats-real/page.tsx` | Four prose sections. **Not the §12.2 component/status table**, and no "Delete this case" control. |
| Fix Path | `components/ActionChecklist.tsx` | A fixed 3-item list, identical for every blocker. No per-`ReasonCode` steps, no routes, no `available`/`unavailableBecause`, no carry list, no effect windows, no persisted progress. §10.4 is unimplemented. |
| Design tokens | `tailwind.config.ts`, `app/globals.css` | Defines `ink #202124`, `stone`, `alert #B42318`, `rupee #B45309`. **None of the eight §11.3 tokens exist** — `--ink` should be `#16213B`, `--paper` `#F7F5F0`, `--stamp` `#B4331F`, plus `--rule`, `--cleared`, `--pending`, `--focus`. No CSS custom properties are defined at all. |
| Typography | `app/globals.css` | `Nirmala UI, Noto Sans Devanagari, system-ui`. §11.4's Anek superfamily and IBM Plex Mono are not loaded, and **no Tamil-capable face is named**. |
| Punctuation in JSX | `components/StatusCodeChip.tsx`, `components/CaseHeader.tsx` | A literal `": "` separator and a literal back-arrow glyph. Not English words, but not catalogue-resolved either. |

### 13.3 Absent — nothing in the tree

**Product core**

- Any working diagnosis: no rule evaluation, no evidence, no `ReasonCode` derivation, no `INDETERMINATE` path.
- The eight personas of §8.4. **One** sample case exists, in `data/sample-case.json`.
- Fault injection: no `FaultProfile`, no `X-NISHAN-Fault` header, no `?fault=` param, no middleware. There is no `/api/` directory of any kind — **no route handlers and no MGSL endpoints exist.**
- Case persistence: no database driver, no connection, no query, no migration runner.
- Idempotency: no `idempotency_key` is written or checked anywhere.
- Offline: no service worker, no IndexedDB, no outbox, no connection-state UI.

**Screens (§11.6)**

- S3 verify/OTP, S5 why, S6 real Fix Path, S7 visit slip, S8 grievance, S9 timeline, S11 demo/persona picker: none exist.
- S2 identify does not exist either. The entry screen asks for a **case ID**, not Aadhaar / mobile / registration number — which inverts §11.7's answer to P2.
- Grievance drafting and filing, SLA clocks, tier escalation, CPGRAMS text, time travel: none.

**Compliance gaps — treat these as bugs, not features**

- **The persistent disclosure banner required by §12.7 is missing from every screen.** `components/SiteChrome.tsx` renders a header with logo and language toggle and no banner. This is the most important honesty control in the build and it is absent.
- No footer, and therefore **no `/whats-real` link on any screen** — that page is reachable only by typing the URL.
- Voice-out (TTS) is absent everywhere. §15 forbids cutting it below "diagnosis screen only".

**Tamil**

`content/catalogue.ta.json` was created in this session with all 79 keys present and every value a `TODO_TA:`-prefixed English string. The plumbing — `Locale` type, resolver map, language toggle — accepts `ta`. **No Tamil text has been written.** §10.2 makes Tamil the canonical persona's language, so this counts as unshipped.

**Process and infrastructure**

- **No test file of any kind, and no test runner in `package.json`.** The "28 tests" and the load-bearing no-API-key journey test described in the old §9.1 do not exist. Nothing automatically enforces the §10.5 copy rules or the §16.5 jargon ban.
- **The project is not a git repository.** No version control, no history, no rollback point, two days from a hard deadline. §12.6's gitleaks pre-commit scan therefore cannot exist either.
- No deployment, no `.env.example`, no Vercel project. R7 requires a live public link.
- No narrative or LLM service — see §9.1. **Correctly absent; keep it that way.**

### 13.4 What this means for the plan

The audit moves the critical path. §14 was written assuming the engine, mocks,
personas and content layer were finished and only screens remained. In fact
**the two things §8.1 calls "the product" — the Mock Government Systems Layer and
the Diagnosis Engine — are both empty stubs**, while the UI they were meant to
feed is partly built and currently reads a static JSON file instead.

§15 says the diagnosis engine may never be cut. It has not been started.

Three things are cheap and unblock everything else: a git repository, a
deployment, and the §12.7 disclosure banner. None takes more than a few minutes,
and all three are required either by this document or by the hackathon rules.

---

## 14. Remaining work

**Today is 26 August. Two build days remain.** Submit by **18:00 on 28 August**,
not 20:00.

### Day 3 — Thursday 27 August (~10h)

| ID | Task | P | Est |
|---|---|---|---|
| NSH-301 | App shell, persistent disclosure banner, routing, footer `/whats-real` link on every screen | P0 | 1h |
| NSH-302 | **S1 Entry** — language switch on first paint, disabled mic button with Bhashini caption, four tap choices, assisted-mode entry. No captcha, no login, primary action above the fold. | P0 | 1h |
| NSH-303 | **S2 Identify + S3 simulated OTP** — three equal routes, "Don't have this?" never dead-ends, in-place simulation disclosure under the OTP field, consent panel in assisted mode | P0 | 1.5h |
| NSH-304 | **S4 Diagnosis + Money Rail** — the signature component. Verdict above the rail, marker at the stopped gate, shut-gate treatment, raw status string as mono secondary. Variants: `INDETERMINATE` (dashed), B6c (bottom, `--cleared`). **DoD: all nine blocker variants render; one `--stamp` per screen; `prefers-reduced-motion` respected.** | P0 | 2.5h |
| NSH-305 | **S6 Fix Path + S7 Visit Slip** — resumable checklist with persisted progress, inline simulated e-KYC, print-optimised slip with officer's-note space, WhatsApp-safe text share | P0 | 2h |
| NSH-306 | **S9 Timeline** — events from `case_events`, actor attribution, SLA days-remaining as a number, distinct terminal styling with "Reopen this" | P0 | 1h |
| NSH-307 | **Offline outbox + service worker** — IndexedDB write before any network attempt, replay on `online`, connection strip, duplicate-action guard. **DoD: Playwright goes offline mid-journey; zero data loss, no duplicate on reconnect.** | P0 | 2h |
| NSH-308 | **Language layer** — en/ta/hi across the entire primary path, `lang` attribute per language, every button tested at the longest string | P0 | 1.5h |
| NSH-309 | **Voice-out** — 🔊 on every verdict, instruction and error. Browser TTS with pre-generated fallback. | P1 | 1h |

> **Case persistence (§13.2, §13.3) must land before or alongside NSH-304**, or the
> diagnosis screen has nothing to read from.

### Day 4 — Friday 28 August (~7h, ending 18:00)

> **Nothing new after 13:00.** The afternoon is testing, video and submission.

| ID | Task | P | Est |
|---|---|---|---|
| NSH-401 | **S8 Grievance draft + simulated filing** — fact-chip row, editable draft in the user's language, routing explained plainly, in-place "not sent anywhere" disclosure at the file button, reference + expected-by date on confirmation | P0 | 1.5h |
| NSH-402 | **SLA clocks + auto-escalation** — T1 15d → T2 +15d → T3 +30d, cron appends escalation events, CPGRAMS text at day 30 | P0 | 1h |
| NSH-403 | **Time travel demo control** — "Advance this case by 15 days," same code path as the cron, labelled as a demo control | P0 | 30m |
| NSH-404 | **S11 Persona picker** — 8 cards, each naming the blocker it demonstrates | P0 | 45m |
| NSH-405 | **Fault switch UI** | P1 | 45m |
| NSH-406 | **S10 `/whats-real`** — the §12.2 table verbatim, "Delete this case" control | P0 | 45m |
| NSH-407 | **Accessibility + performance pass** — axe clean on the primary path, contrast ≥ 7:1 body, targets ≥ 56/48px, focus visible, JS ≤ 150KB gzipped, FCP < 2s throttled 3G | P1 | 1h |
| NSH-408 | **Final cross-device test** — real Android phone, real mobile data, incognito, all three languages, full journey. Then a laptop. **DoD: completed twice with zero intervention.** | P0 | 45m |
| NSH-409 | **Video** — §17 storyboard. Record, do not improvise. Two takes maximum. | P0 | 1.5h |
| NSH-410 | **Project summary (<250 words) + submission. SUBMIT BY 18:00.** | P0 | 45m |

### Deployment — do this first, today

The public URL must exist and work from now on. Every commit redeploys. Open the
production link in an incognito window on mobile data before ending each build
day. **A working public URL is the single cheapest insurance policy in this
build**, and R7 demands it.

### Stage 2 backlog — do not touch before 28 August

Bhashini voice input; SMS/IVR channel; WebRTC in-browser face auth; officer-side
view; multi-state land-record semantics; generalisation demo (same engine over
EPFO claim rejection or Jeevan Pramaan stoppage); real accessibility audit with a
screen-reader user; rejection-code distribution research; PWA install prompt.

---

## 15. Cut list — if behind schedule

Cut in this order. **Do not improvise the order on the day.**

1. **NSH-405** fault switch UI → keep the fault capability, trigger via URL param
   in the video.
2. **NSH-309** voice-out → keep it on the diagnosis screen only.
3. **NSH-308** → ship two languages instead of three.
4. **NSH-403** time travel → pre-seed one already-escalated case instead.
5. **NSH-306** timeline → fold the essential events into the diagnosis screen.

Also on the cut list, and not currently scheduled: WebRTC face capture, any
Bhashini integration, a third+ language beyond en/ta/hi.

**Never cut:** the diagnosis engine, the Money Rail, the offline recovery moment,
`/whats-real`, or the deployment. **Those five are the submission.**

---

## 16. Rules for Claude Code

**Read these before your first edit. They override any instinct to the contrary.**

1. **This document is authoritative.** If a comment, README or older doc
   contradicts it, this file wins. Flag the contradiction; do not silently
   resolve it.
2. **No LLM in the diagnosis path. Ever.** Not a heuristic, not a tiebreak, not a
   "confidence boost." The engine is deterministic or it is broken.
3. **No chatbot. No chat widget. No conversational assistant.** §4 explains why:
   that is the incumbent, and matching it loses.
4. **Zero hardcoded user-facing strings in JSX.** Everything routes through the
   content layer. This is what makes the honesty claim auditable.
5. **No system vocabulary in farmer-facing copy** — `npci|fto|mapper|seeding|dbt|
   pfms|rft` are forbidden in any language. A test enforces this.
6. **Never contact a live government system.** No fetch to any `.gov.in` host, in
   any environment, for any reason.
7. **No real personal data** in fixtures, tests, screenshots or the video.
   Synthetic formats are in §12.3.
8. **Never guess past a gap.** If a system needed to rule out a higher-precedence
   blocker is unreachable, return `INDETERMINATE`. A wrong cause sends someone to
   the wrong office and costs them a day's wage.
9. **`RESOLVED_CREDITED` is the only success terminal.** A closed grievance with
   no money renders as a failure with a "reopen" action.
10. **Every mutating action is idempotent** and written to the outbox before any
    network attempt.
11. **Do not add** a component library, state-management library, ORM, dark mode,
    auth, or any third-party script on the primary path.
12. **Do not add features not in §14.** If something seems missing, it is either
    in §15 (cut) or the Stage 2 backlog. Say so; do not build it.
13. **Run the test suite after every substantial change.** The no-API-key journey
    test is load-bearing — if it goes red, stop and fix it before continuing.
14. **Keep `BUILDLOG.md` and `CREDITS.md` current.** What Codex generated versus
    what was written afterwards is 50% of the judged video runtime, and it is
    hackathon requirement R1.
15. **When time is short, consult §15 and cut in order.** Do not silently descope
    something not on the list.

---

## 17. Video storyboard — two minutes, scripted

**Minute 1 — as a citizen. No narration about technology.**

| Time | Shot |
|---|---|
| 0:00–0:10 | Phone in hand. "Lakshmi's ₹2,000 didn't come. This is what the official portal tells her." Show `Aadhaar Seeding Status: No`. Let it sit for one beat. |
| 0:10–0:20 | Open NISHAN. Tap Tamil. Tap "My instalment did not come." Enter mobile number. |
| 0:20–0:35 | Diagnosis lands. **Money Rail** animates; the marker stops at the shut gate. Verdict read aloud in Tamil. |
| 0:35–0:50 | Tap "Fix this." Visit Slip appears — who to meet, what to carry, what to say. |
| 0:50–1:00 | **The failure moment.** Trigger the fault switch mid-action. "You're offline. Everything is saved on your phone." Reconnect. Nothing lost, nothing duplicated. |

**Minute 2 — how and why.**

| Time | Shot |
|---|---|
| 1:00–1:15 | "Seven systems must agree before this money moves. When one disagrees, the farmer is shown the symptom, never the cause." Show the seven mock modules. |
| 1:15–1:30 | "The diagnosis is deterministic — a versioned rule set, not a language model guessing. No AI writes anything a farmer reads. Every sentence is a pre-authored string." |
| 1:30–1:45 | Grievance screen: fact chips. "She could not have written this complaint. The system already knew every fact in it." Then the SLA clock and auto-escalation via time travel. |
| 1:45–1:55 | "Every government system here is simulated. Nothing is submitted anywhere. Built with Codex — [one concrete thing Codex did]." |
| 1:55–2:00 | Closing: **"PM-KISAN tells you a status. A farmer needs a cause, an action, and a clock."** |

---

## 18. Evidence quality note

Official and press sources (PIB, portal text quoted by secondary sources,
Wadhwani AI, news reports) are treated as authoritative for workflow,
integrations and scheme rules. Aggregator and how-to sites are treated as
**qualitative evidence of recurring user pain**, not as measurement. No figure in
this document should be presented in the demo as an official statistic unless
re-verified against a primary source. **When in doubt in the video, describe the
mechanism, not the number.**

---

*End of specification. Nothing outside this document is authoritative.*
