import Section from "@/components/layout/Section";
import SectionHeading from "@/components/marketing/SectionHeading";
import type { SiteContent } from "@/i18n/siteContent";

export default function FaqSection({ content }: { content: SiteContent }) {
  return <Section id="faq" className="faq-section"><SectionHeading eyebrow={content.faq.eyebrow} title={content.faq.title} body={content.faq.intro} /><div className="faq-list">{content.faq.items.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></Section>;
}
