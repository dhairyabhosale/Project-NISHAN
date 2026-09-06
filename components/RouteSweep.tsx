"use client";

/* The route change, made visible.
 *
 * A teal rule sweeps the top edge each time the path changes, and the incoming
 * content rises in under .page-in. Deliberately not a full-screen overlay: an
 * overlay has to cover the new page to be seen, which means holding it back,
 * and this build's whole argument is that the answer arrives quickly. A 3px
 * rule in the theme's own colour says "that was a navigation" and costs the
 * reader nothing.
 *
 * Keyed on the pathname so the element is new on every navigation, which is
 * what makes a CSS animation replay without any imperative trigger.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteSweep() {
  const pathname = usePathname();
  const first = useRef(true);
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    /* Not on the first paint. The landing page has its own entrance, and a
       sweep on arrival would be a transition from nowhere. */
    if (first.current) { first.current = false; return; }
    setKey(pathname);
  }, [pathname]);

  if (key === null) return null;
  return <div key={key} className="route-sweep" aria-hidden="true" />;
}
