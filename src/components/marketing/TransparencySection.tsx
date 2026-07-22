import { Check, ExternalLink, FileCheck2, Link2, ScanSearch } from "lucide-react";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/marketing/SectionHeading";
import { CONTRACT_LINK } from "@/config/contract";
import type { SiteContent } from "@/i18n/siteContent";

export default function TransparencySection({ content }: { content: SiteContent }) {
  return <Section id="transparency" className="transparency-marketing"><SectionHeading eyebrow={content.transparency.eyebrow} title={content.transparency.title} body={content.transparency.body} align="center" /><div className="transparency-cards"><article><FileCheck2 /><h3>PolygonScan</h3><p>{content.transparency.points[0]}</p></article><article><ScanSearch /><h3>Contract quote</h3><p>{content.transparency.points[2]}</p></article><article><Link2 /><h3>Public events</h3><p>{content.transparency.points[3]}</p></article></div><ul className="check-list transparency-list">{content.transparency.points.map((point) => <li key={point}><Check />{point}</li>)}</ul><a className="button button--outline" href={CONTRACT_LINK} target="_blank" rel="noreferrer">{content.transparency.contract}<ExternalLink /></a></Section>;
}
