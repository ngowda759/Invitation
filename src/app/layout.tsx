import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_Kannada } from "next/font/google";

import { event } from "@/content/event";
import { site } from "@/content/site";

import "./globals.css";

/*
 * Three self-hosted faces, each with one job:
 *   - Cormorant Garamond: the invitation's display voice (titles, names, ornaments).
 *   - Inter: quiet, highly readable body and interface text.
 *   - Noto Serif Kannada: the Kannada identity line, so Kannada copy renders in a
 *     proper Kannada face rather than a fallback.
 * All three are variable fonts, so a single file per face is downloaded and served
 * from the same origin (no runtime request to Google, no layout shift).
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const kannada = Noto_Serif_Kannada({
  subsets: ["kannada"],
  display: "swap",
  variable: "--font-kannada",
  // The Kannada line is optional content; do not preload a face the first paint
  // may not use.
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: event.name,
    template: `%s · ${event.name}`,
  },
  description: event.description,
  applicationName: event.name,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: event.name,
    title: event.name,
    description: event.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The invitation uses one light palette; state it so the browser does not apply a
  // dark form-control or scrollbar treatment that would break the design.
  colorScheme: "light",
  themeColor: "#5a0714",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${kannada.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-maroon focus:px-4 focus:py-2 focus:font-medium focus:text-cream focus:outline-none focus:ring-2 focus:ring-gold-light focus:ring-offset-2 focus:ring-offset-maroon-deep"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
