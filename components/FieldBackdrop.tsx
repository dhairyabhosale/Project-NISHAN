"use client";

/* Auto-changing agricultural backdrop. Landing and About sections only.
 *
 * WHY THIS IS DRAWN, NOT PHOTOGRAPHED:
 *
 *   1. §12.3 forbids anything resembling a real identifiable person, and a
 *      stock photograph of Indian farmland very often contains a face. Placing
 *      a real face beside eight admittedly fictional personas is exactly the
 *      kind of thing the honesty criterion exists to catch.
 *   2. §11.9 budgets ZERO images on the primary path because the target user is
 *      on 2G. These scenes are inline SVG in the palette: about 2KB total,
 *      versus 150-400KB for four compressed photographs.
 *   3. A drawn scene cannot be mistaken for documentary evidence of the scheme.
 *      A photograph can.
 *
 * TODO(decide): to use real photography instead, drop openly-licensed WebP
 * files into /public/img (Unsplash, Pexels or Wikimedia; fields and crops only;
 * no identifiable faces), list them in PHOTOS below, and this component will
 * cross-fade them with the same timing and the same reduced-motion behaviour.
 * Keep them off the case, fix and slip screens - §11.9 is a hard budget there.
 *
 * The loop is decorative, so it is aria-hidden and pauses entirely under
 * prefers-reduced-motion, which renders the first scene and stops. */

import { useEffect, useState } from "react";

/** Populate to switch from drawn scenes to photographs. */
const PHOTOS: { src: string; credit: string }[] = [];

const SCENE_MS = 6000;
const SCENES = 4;

export function FieldBackdrop({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    // Respect the setting at runtime, not just in CSS: a timer that keeps
    // firing is still motion even when the fade is disabled.
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (query.matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % (PHOTOS.length || SCENES)), SCENE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden="true" className={"pointer-events-none absolute inset-0 overflow-hidden " + className}>
      {PHOTOS.length > 0
        ? PHOTOS.map((p, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.src}
              src={p.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
              style={{ opacity: n === i ? 0.22 : 0 }}
            />
          ))
        : Array.from({ length: SCENES }, (_, n) => (
            <div
              key={n}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: n === i ? 1 : 0 }}
            >
              <Scene variant={n} />
            </div>
          ))}
    </div>
  );
}

/** Four field scenes: furrows, standing crop, terraces, and a canal edge.
 *  Flat bands only - §11.1 bans gradients, and flat reads better at 2G anyway. */
function Scene({ variant }: { variant: number }) {
  const rows = 7 + variant;
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="size-full opacity-[0.16]">
      {Array.from({ length: rows }, (_, r) => {
        const y = 40 + (r * (160 / rows));
        const h = 160 / rows - 2;
        const inset = variant === 2 ? r * 6 : 0;
        return (
          <rect
            key={r}
            x={inset}
            y={y}
            width={400 - inset * 2}
            height={h}
            fill="currentColor"
            opacity={0.25 + (r / rows) * 0.6}
          />
        );
      })}
      {variant === 3 && <rect x="0" y="150" width="400" height="12" fill="currentColor" opacity="0.9" />}
      {variant === 1 &&
        Array.from({ length: 14 }, (_, c) => (
          <rect key={c} x={c * 29 + 6} y="30" width="3" height="26" fill="currentColor" opacity="0.5" />
        ))}
    </svg>
  );
}
