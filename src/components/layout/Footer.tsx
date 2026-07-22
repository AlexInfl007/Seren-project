import Link from "next/link";
import Brand from "@/components/layout/Brand";
import Container from "@/components/layout/Container";
import { CONTRACT_LINK } from "@/config/contract";
import type { Locale } from "@/i18n/locales";
import type { SiteContent } from "@/i18n/siteContent";
import { experienceContent } from "@/i18n/experienceContent";

export default function Footer({ locale, content }: { locale: Locale; content: SiteContent }) {
  return (
    <footer className="premium-footer">
      <Container className="footer-grid">
        <div className="footer-brand-block"><Brand locale={locale} /><p>{content.footer.tagline}</p></div>
        <div><h2>{content.footer.navigation}</h2><Link href={`/${locale}#lottery`}>{content.nav.lottery}</Link><Link href={`/${locale}#how-it-works`}>{content.nav.how}</Link><Link href={`/${locale}#faq`}>{content.nav.faq}</Link></div>
        <div><h2>{content.footer.resources}</h2><a href={CONTRACT_LINK} target="_blank" rel="noreferrer">{content.footer.contract}</a><a href="https://polygon.technology/" target="_blank" rel="noreferrer">Polygon</a><a href="https://chain.link/vrf" target="_blank" rel="noreferrer">Chainlink VRF</a></div>
        <p className="footer-risk">{content.footer.risk}</p>
        <p className="footer-security">{experienceContent[locale].securityWarning}</p>
        <small>{content.footer.rights}</small>
      </Container>
    </footer>
  );
}
