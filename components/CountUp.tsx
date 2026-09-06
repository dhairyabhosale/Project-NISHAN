"use client";

/* A published figure counting up from zero.
 *
 * The values are catalogue strings, not numbers: "₹6,000", "9.44 crore",
 * "Rs 18,880 crore", "100% central", "20 June 2026". So the component splits
 * each into prefix, figure and suffix, animates only the figure, and puts the
 * string back together exactly as it was authored. Grouping, decimals and the
 * words around the number are preserved, because §18 says these are reproduced
 * figures and we do not get to reformat them.
 *
 * Dates are not counted. "20 June 2026" and "1.12.2018" are dates, and a date
 * ticking up from zero is nonsense, so anything carrying a four-digit year is
 * rendered as authored. That test is on the string rather than on the index,
 * so it keeps working when the locale changes the surrounding words.
 *
 * The final string is what the server renders. JavaScript resets it to zero
 * only once the section is actually in view, so the figure is correct before
 * hydration, correct without JavaScript, and correct under reduced motion.
 */

import { useEffect, useRef, useState } from "react";

const YEAR = /\b(?:19|20)\d{2}\b/;
/* [\s\S] rather than . with the s flag: dotAll needs an es2018 target and this
   project compiles below that. Same behaviour, no target bump. */
const FIGURE = /^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/;

const DURATION = 1100;

type Parsed = { prefix: string; suffix: string; target: number; decimals: number; grouped: boolean };

function parse(value: string): Parsed | null {
  if (YEAR.test(value)) return null;
  const m = FIGURE.exec(value);
  if (!m) return null;
  const raw = m[2];
  const target = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;
  const dot = raw.indexOf(".");
  return {
    prefix: m[1],
    suffix: m[3],
    target,
    decimals: dot === -1 ? 0 : raw.length - dot - 1,
    grouped: raw.includes(",")
  };
}

/* Indian grouping: 18,880 not 18,880 by thousands all the way up. en-IN gets
   this right and is the grouping the source figures already use. */
function format(n: number, p: Parsed) {
  const fixed = n.toFixed(p.decimals);
  if (!p.grouped) return fixed;
  return Number(fixed).toLocaleString("en-IN", {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals
  });
}

export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const p = parse(value);
    if (!p) return;

    let raf = 0;
    let started = false;

    const run = () => {
      started = true;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / DURATION);
        /* Fast at the start, settling at the end, so the figure is legible for
           most of the run instead of blurring past and stopping dead. */
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(p.prefix + format(p.target * eased, p) + p.suffix);
        if (t < 1) raf = requestAnimationFrame(step);
        else setShown(value);
      };
      setShown(p.prefix + format(0, p) + p.suffix);
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || started) return;
          io.unobserve(el);
          run();
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);

  /* aria-hidden on the animating text and the settled value in the label:
     a screen reader should hear the figure once, not sixty times a second. */
  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular">{shown}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
