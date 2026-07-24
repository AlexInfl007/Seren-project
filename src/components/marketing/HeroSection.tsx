import { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowDown, ExternalLink, ShieldCheck } from "lucide-react";
import Container from "@/components/layout/Container";
import { CONTRACT_LINK } from "@/config/contract";
import type { Locale } from "@/i18n/locales";
import type { SiteContent } from "@/i18n/siteContent";
import { experienceContent } from "@/i18n/experienceContent";

export default function HeroSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const oracle = experienceContent[locale].oracle;
  const desktopImage = getImageProps({
    src: "/assets/hero-seren-desktop.png",
    alt: "",
    width: 1983,
    height: 793,
    sizes: "100vw",
    priority: true,
  }).props;
  const mobileImage = getImageProps({
    src: "/assets/hero-seren-mobile.png",
    alt: "",
    width: 1024,
    height: 1536,
    sizes: "100vw",
    priority: true,
  }).props;

  return (
    <section id="home" className="premium-hero">
      <picture className="hero-picture">
        <source media="(max-width: 680px)" srcSet={mobileImage.srcSet} sizes={mobileImage.sizes} />
        <img {...desktopImage} className="hero-art" alt="" />
      </picture>
      <div className="hero-overlay" />
      <Container className="hero-content">
        <span className="eyebrow"><ShieldCheck />{content.hero.eyebrow}</span>
        <h1>Seren Lottery Chain</h1>
        <p className="hero-slogan">{content.hero.title}</p>
        <p className="hero-description">{content.hero.description}</p>
        <div className="hero-actions">
          <Link className="button button--primary" href={`/${locale}#lottery`}>{content.hero.primary}<ArrowDown /></Link>
          <a className="button button--glass" href={CONTRACT_LINK} target="_blank" rel="noreferrer">{content.hero.secondary}<ExternalLink /></a>
          <Link className="button button--outline" href={`/${locale}#oracle`}>{oracle.title}</Link>
        </div>
        <small>{content.hero.note}</small>
      </Container>
    </section>
  );
}
