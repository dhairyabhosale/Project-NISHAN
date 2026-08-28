import type { Metadata } from "next";
import { Anek_Latin, IBM_Plex_Mono } from "next/font/google";
import en from "../content/catalogue.en.json";
import "./globals.css";
import { LocaleProvider } from "../components/LocaleProvider";
import { SiteChrome } from "../components/SiteChrome";

// §11.4. next/font self-hosts at build time, so no third-party request is made
// at runtime - §11.9 budgets zero third-party scripts on the primary path.
// Latin only in this build; Anek Tamil and Anek Devanagari are not loaded yet,
// so ta/hi currently render in a system fallback face. See §11.4.
const anek = Anek_Latin({ subsets: ["latin"], display: "swap", variable: "--font-anek" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-plex-mono" });

export const metadata: Metadata = { title: en["meta.title"] };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anek.variable} ${plexMono.variable}`}>
      <body>
        <LocaleProvider>
          <SiteChrome>{children}</SiteChrome>
        </LocaleProvider>
      </body>
    </html>
  );
}
