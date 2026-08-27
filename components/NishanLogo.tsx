import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

/**
 * Inline SVG wordmark. No image file, no emblem, no Ashoka Chakra — §2.3
 * forbids any government mark anywhere, including the video.
 *
 * The glyph is the product's own argument: a vertical rail of custody points
 * with the money stopped part-way up it. Single-weight strokes, near-square
 * geometry, same treatment as every other icon in the build.
 */
export function NishanLogo({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true" className="shrink-0">
        {/* the rail */}
        <path d="M9 4.5v21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        {/* cleared gates */}
        <path d="M9 8.5h7M9 14h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        {/* the stop: drawn shut, and heavier than what it follows */}
        <path d="M9 20h12" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
        {/* the money, standing at it */}
        <circle cx="9" cy="20" r="3.75" fill="currentColor" />
      </svg>
      <span>
        <span className="block text-body font-semibold leading-none tracking-wide">
          {resolve("logo.label", {}, locale)}
        </span>
        <span className="mt-1 block text-[11px] leading-tight opacity-90">
          {resolve("logo.tagline", {}, locale)}
        </span>
      </span>
    </div>
  );
}
