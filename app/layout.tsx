import type { Metadata } from "next";
import en from "../content/catalogue.en.json";
import "./globals.css";
import { LocaleProvider } from "../components/LocaleProvider";
import { SiteChrome } from "../components/SiteChrome";

export const metadata: Metadata = { title: en["meta.title"] };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><LocaleProvider><SiteChrome>{children}</SiteChrome></LocaleProvider></body></html>; }
