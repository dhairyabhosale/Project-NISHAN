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
- [ ] 8. DEMO CASE PICKER on /who
- [ ] 9. FAULT SWITCH
- [ ] 10. PROTOTYPE BADGE top-right
- [ ] 11. USER-CREATED DEMO CASES
- [ ] 12. LOGO + FAVICON
- [ ] 13. TAGLINE single line
- [ ] 14. CONTACT PAGE
- [ ] 15. EM DASHES
- [ ] 16. ABOUT THE SCHEME
- [ ] 17. TESTIMONIALS
