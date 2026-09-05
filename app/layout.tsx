import type { Metadata, Viewport } from "next";
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

/* Icons, theme colour and social preview.
 *
 * Every string here is read from the committed catalogue rather than typed in,
 * which is §16.4 applied to metadata: the title a reviewer sees in a WhatsApp
 * preview is the same authored string the page renders.
 *
 * metadataBase makes og:image absolute. Open Graph requires an absolute URL,
 * and a relative one silently yields no preview card at all on most services.
 *
 * app/icon.svg was removed in favour of these: Next's file convention and an
 * explicit icons block both emit <link rel="icon">, and having the two disagree
 * meant tabs could show the old mark depending on which won. */
export const metadata: Metadata = {
  metadataBase: new URL("https://project-nishan.vercel.app"),
  title: en["meta.title"],
  description: en["entry.standfirst"],
  applicationName: en["logo.label"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    siteName: en["logo.label"],
    title: en["meta.title"],
    description: en["entry.headline"],
    images: [{ url: "/nishan-og.png", width: 1200, height: 630, alt: en["logo.tagline"] }]
  },
  twitter: {
    card: "summary_large_image",
    title: en["meta.title"],
    description: en["entry.headline"],
    images: ["/nishan-og.png"]
  }
};

// --teal-deep. Paints the browser chrome on Android and the iOS status bar.
export const viewport: Viewport = { themeColor: "#00796B" };

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
