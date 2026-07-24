import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { isLocale, localeDirection } from "@/i18n/locales";
import "./globals.css";
import "./premium.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const sansFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Seren Lottery Chain", template: "%s | Seren Lottery Chain" },
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0C0B18",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const candidate = requestHeaders.get("x-seren-locale") || "en";
  const locale = isLocale(candidate) ? candidate : "en";
  return (
    <html lang={locale} dir={localeDirection(locale)} data-scroll-behavior="smooth" suppressHydrationWarning className={`${displayFont.variable} ${sansFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
