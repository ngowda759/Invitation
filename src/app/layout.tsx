import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";

import { event } from "@/content/event";
import { site } from "@/content/site";

import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const display = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
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
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
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
