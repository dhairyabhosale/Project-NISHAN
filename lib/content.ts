import en from "../content/catalogue.en.json";

export type CatalogueKey = keyof typeof en;
export type Slots = Record<string, string | number>;
export type ResolvedString = string;
export type Locale = "en" | "hi" | "ta";
