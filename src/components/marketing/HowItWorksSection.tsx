import { CircleDollarSign, Dices, TicketCheck, WalletCards } from "lucide-react";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/marketing/SectionHeading";
import type { SiteContent } from "@/i18n/siteContent";

const icons = [WalletCards, TicketCheck, CircleDollarSign, Dices];

export default function HowItWorksSection({ content }: { content: SiteContent }) {
  return <Section id="how-it-works" className="how-section"><SectionHeading eyebrow={content.how.eyebrow} title={content.how.title} body={content.how.intro} align="center" /><div className="steps-grid">{content.how.steps.map((step, index) => { const Icon = icons[index]; return <article className="feature-card step-card" key={step.title}><span className="step-number">0{index + 1}</span><Icon aria-hidden="true" /><h3>{step.title}</h3><p>{step.body}</p></article>; })}</div></Section>;
}
