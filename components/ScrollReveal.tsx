"use client";

/* Scroll reveal, as progressive enhancement.
 *
 * The markup ships visible. This arms only the elements that are fully below
 * the fold when it runs, then reveals each as it comes up. Nothing on screen is
 * ever hidden, so there is no hydration flash to chase, and a visitor with no
 * JavaScript, or with reduced motion asked for, gets the finished page.
 *
 * WHY A SCROLL SWEEP AND NOT IntersectionObserver. An observer only calls back
 * when the intersection ratio crosses a threshold. Jump the page - a hash link,
 * a flung scroll, restoring a scroll position on back - and an element can go
 * from below the viewport to above it between two frames. Ratio 0 before, ratio
 * 0 after, no threshold crossed, no callback, and the element stays at opacity
 * 0 for good. That is not hypothetical: scrolling straight to the bottom left
 * eight of ten targets armed and five invisible.
 *
 * So the test is positional and runs on scroll: anything whose top has come
 * above the reveal line is revealed, whether it arrived there gradually or in
 * one jump. Throttled to one rAF, passive, and it removes its own listeners as
 * soon as the last target is done.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = "[data-reveal], [data-reveal-group]";

export function ScrollReveal() {
  /* Re-arms after a client-side navigation, which brings new markup with it. */
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let armed: HTMLElement[] = [];

    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (el.dataset.revealDone === "1") return;
      /* Fully below the viewport, or it stays as it is. Anything even partly on
         screen is already being read; hiding it now would be a flash of content
         disappearing, which is worse than no animation at all. */
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.dataset.revealDone = "1";
        return;
      }
      el.classList.add("reveal-armed");
      armed.push(el);
    });

    if (armed.length === 0) return;

    let ticking = false;

    const sweep = () => {
      ticking = false;
      /* Reveal a little before the element is fully up, so the movement is
         finishing as the reader arrives rather than starting. */
      const line = window.innerHeight * 0.9;
      const remaining: HTMLElement[] = [];
      armed.forEach((el) => {
        if (el.getBoundingClientRect().top > line) { remaining.push(el); return; }
        el.dataset.revealDone = "1";
        el.classList.remove("reveal-armed");
        el.classList.add("reveal-in");
      });
      armed = remaining;
      if (armed.length === 0) stop();
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sweep);
    };

    const stop = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    /* One sweep now: the page may already be scrolled, for instance on a back
       navigation that restores position. */
    sweep();

    return stop;
  }, [pathname]);

  return null;
}
