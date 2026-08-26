import type { Verdict } from "./blocker";

export type CaseState = "LOOKED_UP" | "DIAGNOSED" | "ACTION_PENDING" | "RESOLVED";
export interface StateTransition { from: CaseState; to: CaseState; eventId: string; occurredAt: string; }
export interface Case { id: string; state: CaseState; amount: number; verdict: Verdict; }
