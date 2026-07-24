import { CheckCircle2, Clock3, ExternalLink } from "lucide-react";
import type { CeremonyContent } from "@/i18n/ceremonyContent";
import type { ExperienceContent } from "@/i18n/experienceContent";
import type { ActivityEntry, ActivityEventName } from "@/lib/contractHistory";
import { formatTimestamp, shortenHash } from "@/lib/format";

const evidenceEvents: readonly (readonly ActivityEventName[])[] = [
  ["TicketPurchased"],
  ["VrfRequestSent"],
  ["VrfRequestSent"],
  ["RandomnessAccepted"],
  ["RoundFinalized"],
  ["WinnerSelected"],
  ["RoundFinalized", "WinnerSelected"],
  ["PrizeClaimed", "BatchPrizesClaimed"],
];

export default function ProofExplorer({ activity, roundId, content, activityLabels }: {
  activity: ActivityEntry[];
  roundId?: bigint;
  content: CeremonyContent["proof"];
  activityLabels: ExperienceContent["activity"];
}) {
  const relevant = roundId === undefined ? activity : activity.filter((entry) => entry.roundId === undefined || entry.roundId === roundId);
  return (
    <section id="proof" className="proof-explorer" aria-labelledby="proof-title">
      <header>
        <span className="eyebrow">{content.eyebrow}</span>
        <h2 id="proof-title">{content.title}</h2>
        <p>{content.intro}</p>
      </header>
      <ol>
        {content.stages.map((stage, index) => {
          const evidence = relevant.find((entry) => evidenceEvents[index].includes(entry.eventName));
          return (
            <li className={evidence ? "has-evidence" : "is-awaiting"} key={stage.title}>
              <span className="proof-explorer__marker" aria-hidden="true">{evidence ? <CheckCircle2 /> : <Clock3 />}</span>
              <div>
                <small>{evidence ? content.available : content.awaiting}</small>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
                {evidence && (
                  <dl>
                    <div><dt>{content.event}</dt><dd>{evidence.eventName}</dd></div>
                    <div><dt>{activityLabels.block}</dt><dd><bdi>{evidence.blockNumber.toString()}</bdi></dd></div>
                    <div><dt>{activityLabels.transaction}</dt><dd><bdi>{shortenHash(evidence.transactionHash)}</bdi></dd></div>
                    <div><dt><time>{formatTimestamp(evidence.timestamp)}</time></dt><dd><a href={evidence.explorerUrl} target="_blank" rel="noopener noreferrer">PolygonScan<ExternalLink aria-hidden="true" /></a></dd></div>
                  </dl>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
