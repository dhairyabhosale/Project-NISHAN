import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

/**
 * Wordmark. Inline SVG, no image file, no government emblem and no Ashoka
 * Chakra - 2.3 forbids any government mark anywhere, including the video.
 *
 * The glyph is the product's own argument rather than decoration: a vertical
 * custody rail with three cleared gates, a barrier drawn shut across it, and
 * the money standing at that barrier. Squarer and better balanced than the
 * previous mark - the rail now sits on the optical centre, the cleared gates
 * step in rather than running full width, and the disc is large enough to read
 * at favicon size.
 */
export function NishanLogo({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <rect x="1" y="1" width="30" height="30" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <path d="M11 6.5v19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <path d="M11 10.5h6.5M11 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <path d="M6.5 20.5h19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="11" cy="20.5" r="4.25" fill="currentColor" />
      </svg>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-body font-semibold leading-none tracking-wide">
          {resolve("logo.label", {}, locale)}
        </span>
        {/* Item 13: one line at every viewport. The lockup truncates rather
            than wrapping, because a two-line tagline pushes the header taller
            on exactly the 360px screens that can least afford it. */}
        <span className="mt-1 block truncate whitespace-nowrap text-[11px] leading-tight opacity-90">
          {resolve("logo.tagline", {}, locale)}
        </span>
      </span>
    </div>
  );
}
