import type { Case } from "../lib/types/case";
import type { Verdict } from "../lib/types/blocker";

export function diagnoseCase(_case: Case): Verdict {
  // TODO(engine): Read mocked records and return the first matching blocker by precedence.
  throw new Error("Diagnosis engine is not implemented in this scaffold.");
}
