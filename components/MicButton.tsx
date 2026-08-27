import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

/**
 * §9.4 — a prominent, visually disabled microphone with a caption naming
 * Bhashini. It requests no permission, imports no speech library and has no
 * handler. Voice is Stage 2.
 *
 * Inline rather than floating: a floating button collides with the pinned
 * primary action at the bottom of every screen that has one, and §9.4 asks for
 * prominent, which a control hidden behind another control is not.
 */
export function MicButton({ locale }: { locale: Locale }) {
  return (
    <div className="mt-10 flex items-center gap-3 rounded-card border border-rule bg-paper p-4 text-ink-soft">
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-label={resolve("mic.label", {}, locale)}
        onClick={() => undefined}
        className="grid size-14 shrink-0 place-items-center rounded-card bg-rule text-ink-soft"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7" />
        </svg>
      </button>
      <p className="text-label leading-snug">{resolve("mic.caption", {}, locale)}</p>
    </div>
  );
}
