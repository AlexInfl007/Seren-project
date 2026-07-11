"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Blocks, CheckCircle2, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_LINK } from "@/config/contract";
import { useLanguage } from "@/hooks/useLanguage";
import { languageLabels, languages, type Language } from "@/i18n/translations";

export default function ProjectPageContent() {
  const { language, setLanguage, t } = useLanguage();
  const details = [
    [t.sections.transparencyTitle, t.sections.transparencyItems[1]],
    [t.sections.howTitle, t.sections.transparencyItems[2]],
    [t.footer.contract, t.sections.transparencyItems[3]],
  ];

  return (
    <main className="project-page" dir={t.dir}>
      <header className="project-page-header">
        <Link href="/#how" className="project-back"><ArrowLeft /> {t.nav.home}</Link>
        <Link href="/" className="project-logo" aria-label="Seren Lottery Chain">
          <Image src="/assets/logo.png" width={56} height={56} alt="" />
          <span>Seren Lottery Chain</span>
        </Link>
        <div className="project-header-actions">
          <select className="language-select" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t.misc.language}>
            {languages.map((item) => <option value={item} key={item}>{languageLabels[item]}</option>)}
          </select>
          <Link className="outline-button" href={CONTRACT_LINK} target="_blank">{t.footer.contract} <ExternalLink size={15} /></Link>
        </div>
      </header>

      <section className="project-hero">
        <span className="section-kicker">POLYGON · CHAINLINK VRF · SMART CONTRACT</span>
        <h1>{t.sections.projectTitle}</h1>
        {t.sections.projectBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      <section className="architecture-grid">
        {details.map(([title, body], index) => {
          const Icon = index === 0 ? Blocks : index === 1 ? Sparkles : ShieldCheck;
          return <article className="architecture-card" key={title}><Icon /><h2>{title}</h2><p>{body}</p></article>;
        })}
      </section>

      <section className="project-detail panel">
        <div><span className="section-kicker">SEREN LOTTERY CHAIN</span><h2>{t.sections.playTitle}</h2></div>
        <ol>
          {t.sections.playSteps.map((step) => <li key={step.title}><CheckCircle2 /><span><strong>{step.title}</strong>{step.body}</span></li>)}
        </ol>
      </section>

      <section className="project-detail project-principles panel">
        <div><span className="section-kicker">ON-CHAIN FAIRNESS</span><h2>{t.sections.transparencyTitle}</h2></div>
        <ol>{t.sections.transparencyItems.map((item) => <li key={item}><CheckCircle2 /><span>{item}</span></li>)}</ol>
      </section>

      <section className="contract-callout">
        <div><span>{t.misc.address}</span><code>{CONTRACT_ADDRESS}</code></div>
        <Link className="primary-button" href={CONTRACT_LINK} target="_blank">{t.misc.explorer} <ExternalLink size={16} /></Link>
      </section>

      <section className="project-risk panel"><h2>{t.sections.riskTitle}</h2><p>{t.sections.risk}</p></section>
    </main>
  );
}
