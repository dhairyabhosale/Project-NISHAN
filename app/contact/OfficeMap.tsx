"use client";

/* Demo office locator, on a real map.
 *
 * WHAT REPLACED WHAT. This was a hand-drawn schematic of roads and field
 * blocks. It was honest about being a diagram, but it read as filler, and a
 * diagram cannot tell you that Nagpur is a long way from Pune.
 *
 * WHY NOT GOOGLE MAPS. It needs a billable API key, which this build does not
 * have and should not require to run; and the Maps JS SDK is a third-party
 * script of roughly the size of this entire app, on a page a farmer on 2G may
 * open. OpenStreetMap raster tiles need no key, no account and no script: they
 * are <img> elements, so they cost what an image costs and nothing more, and
 * they fall back to the panel colour if the network refuses them. Attribution
 * is required by the tile terms and is rendered under the map.
 *
 * NO MAP LIBRARY EITHER. Leaflet would be a new runtime dependency for pan and
 * zoom that this panel does not offer. A fixed 3x3 tile grid at zoom 6 covers
 * Maharashtra, and Web Mercator is nine lines of arithmetic, done below.
 *
 * THE OFFICES ARE INVENTED. Real cities, real coordinates, made-up offices, and
 * the panel says so. §12.3 forbids anything that could be mistaken for a real
 * record; a plausible office name on a real city is exactly the thing that
 * needs labelling, which is what contact.map_demo does.
 */

import { useState } from "react";
import { useLocale } from "../../components/LocaleProvider";
import { resolve } from "../../content/resolve";
import type { CatalogueKey } from "../../lib/content";

/* Zoom 7, the 4x3 tile block that frames Maharashtra: longitude 70.3 to 81.6
   and latitude 16.6 to 22.9, which holds all four offices with margin. Zoom 6
   was tried first and showed half of western India, which tells the reader
   nothing about where these offices are. Fixed rather than
   computed so the tile list is static markup the browser can start fetching
   immediately. */
const Z = 7;
const X0 = 89;
const Y0 = 55;
const COLS = 4;
const ROWS = 3;
const TILE = 256;

/** Web Mercator, forward. Returns fractional tile coordinates at zoom Z. */
function project(lat: number, lon: number) {
  const n = Math.pow(2, Z);
  const x = ((lon + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

interface Office {
  id: string;
  lat: number;
  lon: number;
  name: CatalogueKey;
  kind: CatalogueKey;
  distance: CatalogueKey;
}

const OFFICES: Office[] = [
  { id: "block", lat: 18.5204, lon: 73.8567, name: "contact.office.block", kind: "authority.block_agriculture_officer", distance: "contact.office.block_dist" },
  { id: "vro", lat: 19.9975, lon: 73.7898, name: "contact.office.vro", kind: "authority.village_revenue_officer", distance: "contact.office.vro_dist" },
  { id: "csc", lat: 19.8762, lon: 75.3433, name: "contact.office.csc", kind: "authority.csc", distance: "contact.office.csc_dist" },
  { id: "bank", lat: 21.1458, lon: 79.0882, name: "contact.office.bank", kind: "authority.bank_branch", distance: "contact.office.bank_dist" }
];

/** Percentage position inside the tile block, so the map scales with its box. */
function place(o: Office) {
  const p = project(o.lat, o.lon);
  return {
    left: ((p.x - X0) / COLS) * 100,
    top: ((p.y - Y0) / ROWS) * 100
  };
}

const TILES = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => ({ x: X0 + c, y: Y0 + r }))
).flat();

export function OfficeMap() {
  const { locale } = useLocale();
  const [active, setActive] = useState<string>("block");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        <div
          className="relative overflow-hidden rounded-card border border-rule bg-cyan-pale"
          style={{ aspectRatio: String(COLS) + " / " + String(ROWS) }}
          role="img"
          aria-label={resolve("contact.map_alt", {}, locale)}
        >
          {/* Nine <img> tiles. No script, no key, no library. If the network
              refuses them the panel keeps its colour and the markers still sit
              in the right places relative to each other. */}
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: "repeat(" + COLS + ", 1fr)" }}
            aria-hidden="true"
          >
            {TILES.map((t) => (
              <img
                key={t.x + "/" + t.y}
                src={"https://tile.openstreetmap.org/" + Z + "/" + t.x + "/" + t.y + ".png"}
                width={TILE}
                height={TILE}
                alt=""
                loading="lazy"
                decoding="async"
                className="block h-full w-full object-cover"
              />
            ))}
          </div>

          {OFFICES.map((o) => {
            const on = o.id === active;
            const pos = place(o);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setActive(o.id)}
                aria-pressed={on}
                className="office-pin"
                style={{ left: pos.left + "%", top: pos.top + "%" }}
              >
                <span className={"office-pin-dot" + (on ? " office-pin-on" : "")} aria-hidden="true" />
                {/* Only the selected pin is labelled. Pune, Nashik and
                    Chhatrapati Sambhajinagar sit within about 200km of each
                    other, so four labels at this scale land on top of one
                    another. Every name is in the list beside the map, so the
                    label is a pointer, not the content. */}
                {on && <span className="office-pin-label">{resolve(o.name, {}, locale)}</span>}
                <span className="sr-only">{resolve(o.name, {}, locale)}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-label text-ink-soft">{resolve("contact.map_attrib", {}, locale)}</p>
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
      </div>
    </div>
  );
}
