import { Check, Gift, UserPlus } from "lucide-react";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/marketing/SectionHeading";
import type { SiteContent } from "@/i18n/siteContent";

export default function ReferralSection({ content }: { content: SiteContent }) {
  return <Section className="referral-section"><div className="split-section split-section--reverse"><div className="referral-visual"><div><UserPlus /><span>+</span><Gift /></div><span className="referral-orbit" /></div><div><SectionHeading eyebrow={content.referral.eyebrow} title={content.referral.title} body={content.referral.body} /><ul className="check-list">{content.referral.points.map((point) => <li key={point}><Check />{point}</li>)}</ul></div></div></Section>;
}
