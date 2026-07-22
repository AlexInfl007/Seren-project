import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seren-project.vercel.app"),
  title: { default: "Seren Lottery Chain", template: "%s | Seren Lottery Chain" },
  description: "Buy 1–100 on-chain lottery tickets, use referral credits, inspect 10 winner places, and claim prizes on Polygon.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Seren Lottery Chain",
    description: "Verified Polygon lottery with exact contract quotes, referral credits, 10 winner places, and self-service prize claims.",
    type: "website",
    locale: "en_US",
    siteName: "Seren Lottery Chain",
  },
  twitter: {
    card: "summary",
    title: "Seren Lottery Chain",
    description: "Verified Polygon lottery with referral credits, 10 winner places, and prize claims.",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0C0B18",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
