import type { CaseState } from "./case";

export interface EventLogEntry { id: string; caseId: string; eventType: string; idempotencyKey: string; fromState: CaseState | null; toState: CaseState; occurredAt: string; payload: Record<string, unknown>; }
