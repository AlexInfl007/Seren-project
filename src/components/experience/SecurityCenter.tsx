import { AlertTriangle, ExternalLink, Fingerprint, ShieldCheck } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_LINK, VRF_COORDINATOR_LINK } from "@/config/contract";
import type { CeremonyContent } from "@/i18n/ceremonyContent";
import type { LotteryState } from "@/lib/contractReads";
import { shortenAddress } from "@/lib/format";

export default function SecurityCenter({ state, content }: { state?: LotteryState; content: CeremonyContent["security"] }) {
  return (
    <section id="security" className="security-center" aria-labelledby="security-title">
      <header>
        <span className="eyebrow"><ShieldCheck aria-hidden="true" />{content.eyebrow}</span>
        <h2 id="security-title">{content.title}</h2>
        <p>{content.intro}</p>
      </header>
      <div className="security-center__identity">
        <article><Fingerprint aria-hidden="true" /><span>{content.network}</span><strong>Polygon Mainnet · 137</strong></article>
        <a href={CONTRACT_LINK} target="_blank" rel="noopener noreferrer"><span>{content.contract}</span><strong><bdi>{shortenAddress(CONTRACT_ADDRESS)}</bdi></strong><ExternalLink aria-hidden="true" /></a>
        <article><span>{content.source}</span><strong>{content.sourceValue}</strong></article>
        <a href={state ? `https://polygonscan.com/address/${state.vrfCoordinator}` : VRF_COORDINATOR_LINK} target="_blank" rel="noopener noreferrer"><span>{content.vrf}</span><strong>Chainlink VRF v2.5</strong><ExternalLink aria-hidden="true" /></a>
        <article><span>{content.audit}</span><strong>{content.auditValue}</strong></article>
      </div>
      <div className="security-center__model">
        <h3>{content.admin}</h3>
        <p>{content.adminValue}</p>
        <ul><li>{content.target}</li><li>{content.fixedTickets}</li><li>{content.oneRequest}</li></ul>
      </div>
      <div className="security-center__warnings" role="note">
        <p><AlertTriangle aria-hidden="true" />{content.seedWarning}</p>
        <p><AlertTriangle aria-hidden="true" />{content.transferWarning}</p>
      </div>
    </section>
  );
}
