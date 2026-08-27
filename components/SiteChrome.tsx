"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageToggle } from "./LanguageToggle";
import { NishanLogo } from "./NishanLogo";
import { useLocale } from "./LocaleProvider";

export function SiteChrome({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  return <div className="min-h-screen bg-cyan-pale text-ink"><header className="on-teal border-b border-rule bg-teal-deep text-paper"><div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-4"><Link href="/"><NishanLogo locale={locale}/></Link><LanguageToggle/></div></header>{children}</div>;
}
