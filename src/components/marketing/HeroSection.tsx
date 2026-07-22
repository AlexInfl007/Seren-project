import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ExternalLink, ShieldCheck } from "lucide-react";
import Container from "@/components/layout/Container";
import { CONTRACT_LINK } from "@/config/contract";
import type { Locale } from "@/i18n/locales";
import type { SiteContent } from "@/i18n/siteContent";

export default function HeroSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  return (
    <section id="home" className="premium-hero">
      <Image className="hero-art" src="/assets/Banner.png" alt="" width={1920} height={1080} priority sizes="100vw" />
      <div className="hero-overlay" />
      <Container className="hero-content">
        <span className="eyebrow"><ShieldCheck />{content.hero.eyebrow}</span>
        <h1>{content.hero.title}</h1>
        <p>{content.hero.description}</p>
        <div className="hero-actions">
          <Link className="button button--primary" href={`/${locale}#lottery`}>{content.hero.primary}<ArrowDown /></Link>
          <a className="button button--glass" href={CONTRACT_LINK} target="_blank" rel="noreferrer">{content.hero.secondary}<ExternalLink /></a>
        </div>
        <small>{content.hero.note}</small>
      </Container>
    </section>
  );
}
