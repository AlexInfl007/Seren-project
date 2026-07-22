import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import Container from "@/components/layout/Container";
import { CONTRACT_LINK } from "@/config/contract";
import type { Locale } from "@/i18n/locales";
import type { SiteContent } from "@/i18n/siteContent";

export default function FinalCtaSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  return <section className="final-cta"><Container><div><span className="eyebrow">Seren Lottery Chain</span><h2>{content.final.title}</h2><p>{content.final.body}</p><div><Link className="button button--primary" href={`/${locale}#lottery`}>{content.final.primary}<ArrowUpRight /></Link><a className="button button--glass" href={CONTRACT_LINK} target="_blank" rel="noreferrer">{content.final.secondary}<ExternalLink /></a></div></div></Container></section>;
}
