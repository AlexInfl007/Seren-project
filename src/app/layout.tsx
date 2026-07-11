import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seren-project.vercel.app"),
  title: { default: "Seren Lottery Chain", template: "%s | Seren Lottery Chain" },
  description: "Transparent on-chain crypto lottery on Polygon with verifiable smart-contract rules, Chainlink VRF randomness and a low-cost chance to win a large prize.",
  keywords: ["crypto lottery", "Polygon lottery", "on-chain lottery", "blockchain lottery", "Chainlink VRF", "POL lottery", "transparent lottery", "Seren Lottery Chain"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Seren Lottery Chain",
    description: "A transparent Polygon lottery with verifiable rules, on-chain activity and Chainlink VRF randomness.",
    type: "website",
    locale: "en_US",
    siteName: "Seren Lottery Chain",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seren Lottery Chain",
    description: "A transparent Polygon lottery with verifiable rules and on-chain activity.",
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
