import { Crown, Medal, Trophy } from "lucide-react";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/marketing/SectionHeading";
import type { SiteContent } from "@/i18n/siteContent";

export default function PrizeStructureSection({ content }: { content: SiteContent }) {
  return <Section className="prize-section"><div className="split-section"><SectionHeading eyebrow={content.prizes.eyebrow} title={content.prizes.title} body={content.prizes.body} /><div className="prize-visual" aria-label={content.prizes.title}><article className="prize-card prize-card--first"><Crown /><span>01</span><p>{content.prizes.first}</p></article><article className="prize-card"><Medal /><span>02–10</span><p>{content.prizes.others}</p></article><Trophy className="prize-watermark" aria-hidden="true" /></div></div><p className="fact-note">{content.prizes.note}</p></Section>;
}
