import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seren-project.vercel.app"),
  title: { default: "Seren Lottery Chain", template: "%s | Seren Lottery Chain" },
  description: "Transparent Polygon lottery interface with wallet-gated on-chain data.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Seren Lottery Chain",
    description: "A wallet-gated interface for the verified Seren lottery contract on Polygon.",
    type: "website",
    locale: "en_US",
    siteName: "Seren Lottery Chain",
  },
  twitter: {
    card: "summary",
    title: "Seren Lottery Chain",
    description: "A wallet-gated interface for the verified Seren lottery contract on Polygon.",
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
