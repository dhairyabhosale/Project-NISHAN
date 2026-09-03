"use client";

/* Demo office locator.
 *
 * A schematic local-area map, drawn inline. Three deliberate choices:
 *
 *   No Google Maps SDK. It needs a paid key, adds a third-party script the
 *   honesty page would have to disclose, and would roughly double the JS on a
 *   page a farmer on 2G might open.
 *
 *   No national outline. A hand-drawn map of India is inevitably imprecise at
 *   its borders, and an imprecise national boundary is not a small thing to
 *   publish. A block-level schematic carries the same information - which
 *   office, how far, what it handles - without making a territorial claim.
 *
 *   Offices are labelled as demo locations, because they are invented. 12.3
 *   forbids anything that could be mistaken for a real record. */

import { useState } from "react";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

interface Office {
  id: string;
  x: number;
  y: number;
  name: CatalogueKey;
  kind: CatalogueKey;
  distance: CatalogueKey;
}

const OFFICES: Office[] = [
  { id: "csc", x: 28, y: 34, name: "contact.office.csc", kind: "authority.csc", distance: "contact.office.csc_dist" },
  { id: "bank", x: 63, y: 26, name: "contact.office.bank", kind: "authority.bank_branch", distance: "contact.office.bank_dist" },
  { id: "vro", x: 44, y: 62, name: "contact.office.vro", kind: "authority.village_revenue_officer", distance: "contact.office.vro_dist" },
  { id: "block", x: 76, y: 72, name: "contact.office.block", kind: "authority.block_agriculture_officer", distance: "contact.office.block_dist" }
];

export function OfficeMap() {
  const { locale } = useLocale();
  const [active, setActive] = useState<string>("csc");
  const current = OFFICES.find((o) => o.id === active) ?? OFFICES[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="overflow-hidden rounded-card border border-rule bg-paper">
        <svg viewBox="0 0 100 90" className="block w-full" role="img" aria-label={resolve("contact.map_alt", {}, locale)}>
          <rect width="100" height="90" fill="var(--cyan-pale)" />
          {/* Roads: the structure a person actually navigates by. */}
          <path d="M0 40h100M52 0v90M0 70h100M24 0v90" stroke="var(--rule)" strokeWidth="2.5" fill="none" />
          <path d="M0 18h100M80 0v90" stroke="var(--rule)" strokeWidth="1.2" fill="none" />
          {/* Field blocks. */}
          {[[4, 44], [30, 44], [58, 44], [84, 74]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="14" height="20" fill="var(--green-soft)" opacity="0.55" />
          ))}
          {OFFICES.map((o) => {
            const on = o.id === active;
            return (
              <g key={o.id} onClick={() => setActive(o.id)} style={{ cursor: "pointer" }}>
                <circle cx={o.x} cy={o.y} r={on ? 5.5 : 4} fill={on ? "var(--teal-deep)" : "var(--ink-soft)"} />
                <circle cx={o.x} cy={o.y} r="1.6" fill="var(--white)" />
              </g>
            );
          })}
        </svg>
      </div>

      <div>
        <ul className="space-y-2">
          {OFFICES.map((o) => {
            const on = o.id === active;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setActive(o.id)}
                  aria-pressed={on}
                  className={
                    "flex min-h-14 w-full flex-col items-start rounded-card border p-3 text-left " +
                    (on ? "border-teal-deep bg-green-soft" : "border-rule bg-paper hover:bg-cyan-pale")
                  }
                >
                  <span className="text-body font-semibold text-ink">{resolve(o.name, {}, locale)}</span>
                  <span className={"text-label " + (on ? "text-ink" : "text-ink-soft")}>
                    {resolve(o.kind, {}, locale)} - {resolve(o.distance, {}, locale)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 rounded-card border border-pending bg-paper p-3 text-label font-semibold text-ink">
          {resolve("contact.map_demo", {}, locale)}
        </p>
        <p className="sr-only">{resolve(current.name, {}, locale)}</p>
      </div>
    </div>
  );
}
