import { Crown, ExternalLink, Medal, Trophy } from "lucide-react";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/marketing/SectionHeading";
import type { SiteContent } from "@/i18n/siteContent";
import type { Locale } from "@/i18n/locales";
import { experienceContent } from "@/i18n/experienceContent";
import { CONTRACT_LINK } from "@/config/contract";

export default function PrizeStructureSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const labels = experienceContent[locale].winners;
  return <Section className="prize-section"><div className="split-section"><div><SectionHeading eyebrow={content.prizes.eyebrow} title={content.prizes.title} body={content.prizes.body} /><p className="prize-explanation">{labels.uniqueTickets}</p><p className="prize-explanation">{labels.repeatedWallet}</p><div className="prize-links"><a href={CONTRACT_LINK} target="_blank" rel="noreferrer">{labels.rules}<ExternalLink aria-hidden="true" /></a><a href={`${CONTRACT_LINK.replace("#code", "#readContract")}`} target="_blank" rel="noreferrer">{labels.onchain}<ExternalLink aria-hidden="true" /></a></div></div><div className="prize-visual" aria-label={content.prizes.title}><article className="prize-card prize-card--first"><Crown /><span>01</span><p>{content.prizes.first}</p></article><article className="prize-card"><Medal /><span>02–10</span><p>{content.prizes.others}</p></article><Trophy className="prize-watermark" aria-hidden="true" /></div></div><p className="fact-note">{content.prizes.note}</p></Section>;
}
