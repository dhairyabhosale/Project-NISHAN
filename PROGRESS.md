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
- [ ] 4. HEADER wrapping
- [ ] 5. LANGUAGES order
- [ ] 6. REGISTRATION MENU dead links
- [ ] 7. FIND MY PAYMENT footer block
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
