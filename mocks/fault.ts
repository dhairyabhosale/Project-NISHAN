/* Fault injection for the Mock Government Systems Layer — CLAUDE.md §8.4.
 *
 * This is how a reviewer sees INDETERMINATE handling on demand, which §8.4 calls
 * the most persuasive twenty seconds of the video. NSH-405 (the fault switch UI)
 * is cut per §15; the capability stays and is triggered by URL parameter.
 *
 * Controlled by the `X-NISHAN-Fault` header or a `?fault=` query param. */

import type { SystemCode } from "../lib/types/systems";
import { SYSTEM_CODES } from "../lib/types/systems";

export type FaultProfile = {
  /** Simulate 2G or a loaded portal. */
  latencyMs?: number;
  /** 0..1. Seeded per (system, reference) so a given case is reproducible — see
   *  seededUnitInterval below. §8.5 requires same inputs → same output, always. */
  failureRate?: number;
  /** Deterministic failure for the demo. */
  forceStatus?: number;
  /** Return the record as of an earlier time, e.g. "P7D". */
  staleBy?: string;
  /** Never respond. */
  timeout?: boolean;
};

export type FaultMap = Partial<Record<SystemCode, FaultProfile>>;

/** Named shorthands, so a demo URL reads as English: ?fault=mNPCI:timeout */
const SHORTHAND: Record<string, FaultProfile> = {
  timeout: { timeout: true },
  slow: { latencyMs: 2500 },
  crawl: { latencyMs: 6000 },
  down: { forceStatus: 503 },
  flaky: { failureRate: 0.5 },
  stale: { staleBy: "P7D" }
};

function isSystemCode(v: string): v is SystemCode {
  return (SYSTEM_CODES as readonly string[]).includes(v);
}

function parseClause(clause: string): FaultProfile {
  const out: FaultProfile = {};
  for (const part of clause.split("+").map((p) => p.trim()).filter(Boolean)) {
    if (SHORTHAND[part]) { Object.assign(out, SHORTHAND[part]); continue; }
    const [k, v] = part.split("=").map((x) => x.trim());
    if (v === undefined) continue;
    if (k === "latencyMs") out.latencyMs = Number(v) || 0;
    else if (k === "failureRate") out.failureRate = Math.min(1, Math.max(0, Number(v) || 0));
    else if (k === "forceStatus") out.forceStatus = Number(v) || 500;
    else if (k === "staleBy") out.staleBy = v;
    else if (k === "timeout") out.timeout = v !== "false";
  }
  return out;
}

/**
 * Grammar, deliberately readable:
 *   ?fault=slow                     every system is slow
 *   ?fault=mNPCI:timeout            one system never answers
 *   ?fault=mNPCI:down,mLAND:slow    several, comma separated
 *   ?fault=mBANK:slow+stale         combine with +
 * A JSON object is also accepted, for the header form.
 */
export function parseFaultSpec(spec: string | null | undefined): FaultMap {
  if (!spec) return {};
  const trimmed = spec.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith("{")) {
    try {
      const raw = JSON.parse(trimmed) as Record<string, FaultProfile>;
      const out: FaultMap = {};
      for (const [k, v] of Object.entries(raw)) if (isSystemCode(k)) out[k] = v;
      return out;
    } catch {
      return {};
    }
  }

  const out: FaultMap = {};
  for (const entry of trimmed.split(",").map((e) => e.trim()).filter(Boolean)) {
    const idx = entry.indexOf(":");
    if (idx === -1) {
      // No system named — apply to all seven.
      const profile = parseClause(entry);
      for (const c of SYSTEM_CODES) out[c] = { ...out[c], ...profile };
      continue;
    }
    const system = entry.slice(0, idx).trim();
    if (!isSystemCode(system)) continue;
    out[system] = { ...out[system], ...parseClause(entry.slice(idx + 1)) };
  }
  return out;
}

/** Reads either transport. The header wins when both are present. */
export function readFaultMap(headers: Headers, url: URL): FaultMap {
  const fromHeader = headers.get("X-NISHAN-Fault") ?? headers.get("x-nishan-fault");
  if (fromHeader) return parseFaultSpec(fromHeader);
  return parseFaultSpec(url.searchParams.get("fault"));
}

/** Deterministic 0..1 from a string. §8.5 forbids nondeterminism in this path,
 *  so failureRate is a stable function of (system, reference), not Math.random. */
export function seededUnitInterval(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** How long a `timeout: true` fault waits before the reader gives up. Short
 *  enough that the demo stays watchable. */
export const TIMEOUT_MS = 1200;
