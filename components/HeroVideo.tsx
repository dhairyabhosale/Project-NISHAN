"use client";

/* The hero background video.
 *
 * WHAT THIS COMPONENT IS ALLOWED TO BE: decoration that can fail. The headline,
 * the standfirst and both CTAs are server-rendered above it and do not wait on
 * it. F1 cost us the entire site once by putting content behind something only
 * JavaScript could resolve, and a 1.2 MB video is a much better candidate for
 * that mistake than a splash screen was.
 *
 * So the <video> element itself is NOT rendered until we have decided it should
 * be. Until then the band shows the poster as a CSS background, which is 13.6 kB
 * and in the server HTML. With JavaScript off, that poster is the hero: no
 * request for the video is ever made.
 *
 * WHEN WE DECIDE NOT TO PLAY:
 *
 *   prefers-reduced-motion   §11.5. A permanently moving background is not the
 *                            one orchestrated motion this product allows.
 *   saveData                 the reader has asked their browser to spend less.
 *   slow-2g or 2g            §5.1 puts the reader on exactly this connection.
 *                            1.2 MB at 2G is roughly half a minute of their
 *                            data for something they did not ask to see.
 *
 * In all three cases the poster stays and nothing downloads. That is the whole
 * point of gating in JavaScript rather than in CSS: a <video> in the markup
 * starts fetching before any media query can stop it.
 */

import { useEffect, useState } from "react";

interface SaveDataConnection {
  saveData?: boolean;
  effectiveType?: string;
}

/** Every reason not to spend a megabyte of someone else's data. */
function shouldPlay(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const c = (navigator as Navigator & { connection?: SaveDataConnection }).connection;
    if (c?.saveData) return false;
    if (c?.effectiveType === "slow-2g" || c?.effectiveType === "2g") return false;
    return true;
  } catch {
    // No matchMedia, no connection API, or a browser that objects to being
    // asked. The poster is a perfectly good hero, so default to not spending.
    return false;
  }
}

export function HeroVideo() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    setPlay(shouldPlay());
    // Re-decide if the reader changes the setting while the page is open.
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPlay(shouldPlay());
    q.addEventListener("change", onChange);
    return () => q.removeEventListener("change", onChange);
  }, []);

  if (!play) return null;

  return (
    <video
      // No audio track exists in the file, so autoplay cannot be refused on
      // that basis - but muted is still required by every browser's policy.
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/hero-poster.webp"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 size-full object-cover"
    >
      {/* WebM first: 991 kB against the MP4's 1,240 kB, so a browser that can
          take it saves a quarter of the transfer. */}
      <source src="/hero.webm" type="video/webm" />
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  );
}
