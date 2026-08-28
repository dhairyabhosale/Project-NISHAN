# NISHAN - autonomous loop progress

Tick one line per checklist item. Resume from the lowest unticked number.

- [x] 0. DEPLOY - **not a fault.** Production already matched `main`. Verified
      local HEAD == origin/main == deployed `89d3ee0`; old scaffold Case-ID
      field returns 0 occurrences; new headline, Bhashini launcher and
      Registration nav all present in the fetched HTML. `X-Vercel-Cache: HIT`
      with `Age: 3558` was an edge hit serving correct content. The reported
      symptom was a stale browser cache, not a failed deploy.
- [x] 1. MOTION - CSS-only layer: hover+press on every interactive element, route
      transition, panel expand, skeleton loading route, marquee track paused on
      hover/focus. Reduced-motion block resolves every animation to its final
      state. Rail marker remains the one hero moment.
- [x] 2. IMAGERY - auto-changing agricultural backdrop on LANDING + ABOUT only,
      never on case/fix/slip (11.9 budgets zero images there). Shipped as inline
      SVG field scenes in the palette (~2KB) rather than photographs: I cannot
      verify a stock photo contains no identifiable face, and 12.3 forbids
      anything resembling a real person beside fictional personas. PHOTOS[] in
      FieldBackdrop.tsx is a drop-in slot for licensed WebP - see TODO(decide).
      Timer does not run at all under prefers-reduced-motion.
- [x] 3. FAQ PAGE - /faq, ten questions on the real portal FAQ subject matter
      (e-KYC, instalment not received, Aadhaar-to-bank link, land records,
      eligibility, exclusion incl. the MTS carve-out, registration status,
      mobile update, beneficiary list, grievance routing). Accordion with an
      animated reveal, one open at a time. All copy from the catalogue in en/hi/mr.
      Linked from the header Help menu.
- [x] 4. HEADER - whitespace-nowrap on every nav link and dropdown trigger, so
      "Check a payment" and "What is real" hold one line at every width >=360px.
- [x] 5. LANGUAGES - order is now en, hi, mr, then the eleven pending ones, so
      all three working languages sit at the top.
- [x] 6. REGISTRATION MENU - every item now deep-links to its own card on
      /services via #svc-N anchors with scroll-mt, instead of four entries
      landing on the same generic page. Payments and Help items too. No dead
      links remain in the header.
- [x] 7. FIND MY PAYMENT - static block removed from the site footer; footer
      regridded to two columns. The journey is reached from the header and /who.
- [x] 8. DEMO CASE PICKER - eight selectable persona cards on /who, each naming
      the person, the blocker it demonstrates and its live case reference. /who
      became a server component so the fixtures stay off the client bundle.
- [x] 9. FAULT SWITCH - **already worked.** Verified mNPCI:timeout,
      mUIDAI:timeout, mSCHEME:timeout and mLAND:down all return the
      INDETERMINATE verdict with the correct cleared-gate list; `slow` correctly
      stays certain because latency is not silence. What was missing was reach:
      the section told a reviewer to hand-edit a URL. It now offers three
      one-tap links.
- [x] 10. PROTOTYPE BADGE - fixed top-right, z-60, version-badge styling,
      non-dismissible, present on every screen and surviving scroll. Header row
      reserves 104px inline-end so nav never slides under it. Full 12.7 sentence
      still closes every page in the footer; badge carries it as a title.
- [x] 11. USER-CREATED DEMO CASES - /demo/new: pick a blocker, enter a name,
      get a working reference. STATELESS: the case is encoded into its own link
      so it opens on any serverless instance and survives a restart, same reason
      references are derived not allocated. Picking a blocker chooses the
      SITUATION not the answer - the real engine diagnoses a cloned fixture with
      fresh 12.3 identifiers. Verified: B4 request -> NSH-8A74 -> case renders
      the B4 verdict with MOCKACC/NSHDEMO ids only.
- [x] 12. LOGO + FAVICON - new inline-SVG wordmark: framed custody rail, three
      cleared gates stepping in, a barrier drawn shut, money standing at it.
      Squarer and better balanced; disc large enough to read at favicon size.
      app/icon.svg wired as the favicon in --teal-deep. No image files.
- [x] 13. TAGLINE - logo lockup is whitespace-nowrap + truncate, so it holds one
      line at every viewport. TODO(decide): the checklist quotes the Rs 2,000
      tagline, but the previous instruction removed that wording as an explicit
      objective change. Kept the current tagline and fixed the wrapping, which
      satisfies both readings; say the word to restore the old wording.
- [x] 14. CONTACT PAGE - /contact in the Help menu. Demo phone and email, a
      contact form that discloses in place that it sends nothing, and an office
      locator. Map is an inline schematic SVG: no Google Maps SDK (paid key,
      third-party script, JS budget) and deliberately NO national outline - a
      hand-drawn India is imprecise at its borders and an imprecise national
      boundary is not a small thing to publish. Offices labelled as demo.
- [ ] 15. EM DASHES
- [ ] 16. ABOUT THE SCHEME
- [ ] 17. TESTIMONIALS
