"use client";

import { ExternalLink, FastForward, Sparkles } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { Address } from "viem";
import { addressLink } from "@/config/contract";
import type { CeremonyContent } from "@/i18n/ceremonyContent";
import type { RoundResult } from "@/lib/contractReads";
import { formatPol, shortenAddress } from "@/lib/format";

export default function RoundFinalizationReveal({ results, roundId, account, content, onClaim, claimPending }: {
  results: RoundResult[];
  roundId: bigint;
  account?: Address;
  content: CeremonyContent["reveal"];
  onClaim: (roundId: bigint) => void;
  claimPending: boolean;
}) {
  const [skipped, setSkipped] = useState(false);
  if (results.length === 0) return null;

  const ordered = [...results].sort((a, b) => a.place - b.place);
  const canClaim = ordered.some((result) => !result.claimed && result.winner.toLowerCase() === account?.toLowerCase());

  return (
    <section className={`finalization-reveal ${skipped ? "is-skipped" : ""}`} aria-labelledby="reveal-title">
      <div className="finalization-reveal__heading">
        <span className="eyebrow"><Sparkles aria-hidden="true" />{content.eyebrow}</span>
        <h2 id="reveal-title">{content.title}</h2>
        <p>{content.intro}</p>
        <button type="button" className="button button--outline reveal-skip" onClick={() => setSkipped(true)} disabled={skipped}>
          <FastForward aria-hidden="true" />{skipped ? content.complete : content.skip}
        </button>
      </div>
      <ol className="finalization-reveal__results" aria-live="polite">
        {ordered.map((result) => (
          <li className={`reveal-position reveal-position--${result.place}`} style={{ "--reveal-order": result.place === 1 ? 9 : 10 - result.place } as CSSProperties} key={result.place}>
            <span>#{result.place}</span>
            <strong><bdi>{result.ticketId.toString()}</bdi></strong>
            <a href={addressLink(result.winner)} target="_blank" rel="noopener noreferrer" title={result.winner}>
              <bdi>{shortenAddress(result.winner)}</bdi><ExternalLink aria-hidden="true" />
            </a>
            <b>{formatPol(result.prize)}</b>
          </li>
        ))}
      </ol>
      {canClaim && <button type="button" className="button button--primary" disabled={claimPending} onClick={() => onClaim(roundId)}>{content.claim}</button>}
    </section>
  );
}
