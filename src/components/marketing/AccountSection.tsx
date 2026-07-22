import { Check, LayoutDashboard } from "lucide-react";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/marketing/SectionHeading";
import type { SiteContent } from "@/i18n/siteContent";

export default function AccountSection({ content }: { content: SiteContent }) {
  return <Section className="account-marketing"><div className="split-section"><div><SectionHeading eyebrow={content.account.eyebrow} title={content.account.title} body={content.account.body} /><ul className="check-list">{content.account.points.map((point) => <li key={point}><Check />{point}</li>)}</ul></div><div className="dashboard-preview" aria-hidden="true"><div className="preview-top"><LayoutDashboard /><span /></div><div className="preview-stats"><span /><span /><span /></div><div className="preview-chart"><i /><i /><i /><i /><i /></div></div></div></Section>;
}
