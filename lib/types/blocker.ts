export type Blocker = "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "INDETERMINATE";
export type SubCause = string;
export interface Verdict { blocker: Blocker; subCause: SubCause; statusCode: string; }
export type Precedence = readonly Exclude<Blocker, "INDETERMINATE">[];
