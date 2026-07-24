"use client";

import { ExternalLink, RadioTower } from "lucide-react";
import type { CSSProperties } from "react";
import { CONTRACT_LINK } from "@/config/contract";
import type { CeremonyContent } from "@/i18n/ceremonyContent";
import type { LotteryState } from "@/lib/contractReads";
import { formatCount, formatPol } from "@/lib/format";
import { calculatePoolProgress } from "@/lib/poolProgress";
import type { RoundCoreState } from "@/lib/roundExperience";

type CoreStyle = CSSProperties & { "--core-charge": string; "--core-intensity": number };

export default function SerenRoundCore({ state, coreState, content, purchasePulseKey }: {
  state?: LotteryState;
  coreState: RoundCoreState;
  content: CeremonyContent["core"];
  purchasePulseKey?: string;
}) {
  const progress = calculatePoolProgress(state?.round.grossPool ?? 0n, state?.round.targetPool ?? 0n);
  const hasRound = Boolean(state && state.roundId > 0n);

  return (
    <section className={`round-core round-core--${coreState}`} data-core-state={coreState} aria-labelledby="round-core-title" style={{ "--core-charge": `${progress.percent}%`, "--core-intensity": .74 + progress.percent / 400 } as CoreStyle}>
      <div className="round-core__space" aria-hidden="true">
        <div className="round-core__orbit round-core__orbit--outer" />
        <div className="round-core__orbit round-core__orbit--inner" />
        <div className="round-core__lotus">
          {Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--petal": index } as CSSProperties} />)}
          <span />
        </div>
        <div className="round-core__charge" />
        {purchasePulseKey && <b className="round-core__purchase-pulse" key={purchasePulseKey} />}
      </div>
      <div className="round-core__content">
        <span className="eyebrow"><RadioTower aria-hidden="true" />{content.eyebrow}</span>
        <h2 id="round-core-title">{content.title}</h2>
        <div className="round-core__status" role="status" aria-live="polite">
          <span className="status-dot is-live" aria-hidden="true" />
          <strong>{content.status[coreState]}</strong>
        </div>
        <p>{content.message[coreState]}</p>
        {hasRound && state && (
          <dl className="round-core__metrics">
            <div><dt>{content.round}</dt><dd><bdi>#{state.roundId.toString()}</bdi></dd></div>
            <div><dt>{content.pool}</dt><dd>{formatPol(state.round.grossPool)}</dd></div>
            <div><dt>{content.target}</dt><dd>{formatPol(state.round.targetPool)}</dd></div>
            <div><dt>{content.tickets}</dt><dd>{formatCount(state.round.totalTickets)}</dd></div>
            <div><dt>{content.price}</dt><dd>{formatPol(state.round.ticketPrice)}</dd></div>
          </dl>
        )}
        <a className="round-core__source" href={CONTRACT_LINK} target="_blank" rel="noopener noreferrer">
          {content.verifiedSource}<ExternalLink aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
