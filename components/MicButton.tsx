import { resolve } from "../content/resolve";
import type { Locale } from "../lib/content";

export function MicButton({ locale }: { locale: Locale }) {
  return <div className="fixed bottom-4 right-4 z-20 flex max-w-52 items-center gap-2 rounded-card border border-rule bg-paper p-2 text-ink-soft shadow-lg" aria-disabled="true"><button type="button" aria-label={resolve("mic.label", {}, locale)} onClick={() => undefined} className="grid size-12 shrink-0 place-items-center rounded-card bg-rule" disabled><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg></button><span className="pr-2 text-[13px] font-semibold leading-tight">{resolve("mic.caption", {}, locale)}</span></div>;
}
