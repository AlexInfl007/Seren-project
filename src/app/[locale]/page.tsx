import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AccountSection from "@/components/marketing/AccountSection";
import FaqSection from "@/components/marketing/FaqSection";
import FinalCtaSection from "@/components/marketing/FinalCtaSection";
import HeroSection from "@/components/marketing/HeroSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import PrizeStructureSection from "@/components/marketing/PrizeStructureSection";
import ReferralSection from "@/components/marketing/ReferralSection";
import TransparencySection from "@/components/marketing/TransparencySection";
import TrustBar from "@/components/marketing/TrustBar";
import FloatingPolCoins from "@/components/experience/FloatingPolCoins";
import SerenOracle from "@/components/experience/SerenOracle";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import LotteryDashboard from "@/components/lottery/LotteryDashboard";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { isLocale, locales, type Locale } from "@/i18n/locales";
import { siteContent } from "@/i18n/siteContent";
import { getCanonicalOrigin, isProductionSeo, languageAlternates, localeUrl } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};
  const content = siteContent[candidate];
  const production = isProductionSeo();
  const url = localeUrl(candidate);
  const title = content.metadata.title.includes("Seren Lottery Chain")
    ? content.metadata.title
    : `Seren Lottery Chain | ${content.metadata.title}`;
  const socialImage = {
    url: "/assets/hero-seren-desktop.png",
    width: 1983,
    height: 793,
    alt: `Seren Lottery Chain — ${content.hero.title}`,
  };
  return {
    metadataBase: new URL(getCanonicalOrigin()),
    title,
    description: content.metadata.description,
    robots: production ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
    alternates: production ? { canonical: url, languages: languageAlternates() } : undefined,
    openGraph: {
      title,
      description: content.metadata.description,
      type: "website",
      siteName: "Seren Lottery Chain",
      url: production ? url : undefined,
      locale: candidate === "zh" ? "zh_CN" : `${candidate}_${candidate.toUpperCase()}`,
      images: [socialImage],
    },
    twitter: { card: "summary_large_image", title, description: content.metadata.description, images: [socialImage.url] },
  };
}

function JsonLd({ locale }: { locale: Locale }) {
  const content = siteContent[locale];
  const url = localeUrl(locale);
  const graph = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Seren Lottery Chain", url, inLanguage: locale },
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Seren Lottery Chain", url, applicationCategory: "FinanceApplication", operatingSystem: "Web", description: content.metadata.description, inLanguage: locale },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: content.faq.items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />;
}

export default async function LocalePage({ params }: Props) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();
  const locale = candidate;
  const content = siteContent[locale];
  return (
    <WalletProvider>
      <Header locale={locale} content={content} />
      <main>
        <FloatingPolCoins />
        <HeroSection locale={locale} content={content} />
        <TrustBar content={content} />
        <LotteryDashboard
          locale={locale}
          afterAccount={<SerenOracle locale={locale} />}
          beforeTransparency={<TransparencySection content={content} />}
          afterDashboard={<><HowItWorksSection content={content} /><PrizeStructureSection locale={locale} content={content} /><AccountSection content={content} /><ReferralSection content={content} /><FaqSection content={content} /><FinalCtaSection locale={locale} content={content} /></>}
        />
      </main>
      <Footer locale={locale} content={content} />
      <JsonLd locale={locale} />
    </WalletProvider>
  );
}
