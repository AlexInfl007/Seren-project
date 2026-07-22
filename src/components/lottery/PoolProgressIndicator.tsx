import { DatabaseZap } from "lucide-react";
import { formatPol } from "@/lib/format";
import { calculatePoolProgress } from "@/lib/poolProgress";
import type { ExperienceContent } from "@/i18n/experienceContent";

export type PoolProgressStatus = "disconnected" | "connecting" | "wrong-network" | "loading" | "loaded" | "round-unavailable" | "rpc-error" | "contract-error";

type Props = {
  status: PoolProgressStatus;
  currentPool?: bigint;
  targetPool?: bigint;
  roundId?: bigint;
  roundStatus?: string;
  ticketPrice?: bigint;
  ticketsSold?: bigint;
  lastUpdatedBlock?: bigint;
  content: ExperienceContent["pool"];
  labels: { round: string; status: string; ticketPrice: string; tickets: string };
};

function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);
}

function statusMessage(status: Exclude<PoolProgressStatus, "loaded">, content: Props["content"]) {
  return {
    disconnected: content.connect,
    connecting: content.connecting,
    "wrong-network": content.wrongNetwork,
    loading: content.loading,
    "round-unavailable": content.unavailable,
    "rpc-error": content.rpcError,
    "contract-error": content.contractError,
  }[status];
}

export default function PoolProgressIndicator(props: Props) {
  const progress = calculatePoolProgress(props.currentPool ?? 0n, props.targetPool ?? 0n);
  if (props.status !== "loaded" || props.currentPool === undefined || props.targetPool === undefined) {
    return (
      <div className={`pool-indicator pool-indicator--${props.status}`} data-state={props.status}>
        <div className="pool-indicator__locked" role="status">
          <span className="pool-indicator__skeleton" aria-hidden="true" />
          <p>{statusMessage(props.status === "loaded" ? "loading" : props.status, props.content)}</p>
        </div>
        <p className="pool-indicator__note">{props.content.informational}</p>
      </div>
    );
  }

  const current = formatPol(props.currentPool);
  const target = formatPol(props.targetPool);
  const remaining = formatPol(progress.remainingAmount);
  return (
    <div className="pool-indicator" data-state="loaded">
      <div className="pool-indicator__heading">
        <div>
          <strong>{fill(props.content.currentOfTarget, { current, target })}</strong>
          <span>{fill(props.content.filled, { percent: progress.percent.toFixed(2) })}</span>
        </div>
        <span className="pool-indicator__source"><DatabaseZap aria-hidden="true" />{props.content.source}</span>
      </div>
      <div className="pool-indicator__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
        <span className="pool-indicator__fill" style={{ width: `${progress.percent}%` }}><i aria-hidden="true" /></span>
        <div className="pool-indicator__marks" aria-hidden="true"><span>10%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
      </div>
      <div className="pool-indicator__meta">
        <span>{fill(props.content.remaining, { amount: remaining })}</span>
        {props.lastUpdatedBlock !== undefined && <span>{fill(props.content.lastBlock, { block: props.lastUpdatedBlock.toString() })}</span>}
      </div>
      <dl className="pool-indicator__facts">
        <div><dt>{props.labels.round}</dt><dd>{props.roundId?.toString() ?? "—"}</dd></div>
        <div><dt>{props.labels.status}</dt><dd>{props.roundStatus ?? "—"}</dd></div>
        <div><dt>{props.labels.ticketPrice}</dt><dd>{formatPol(props.ticketPrice)}</dd></div>
        <div><dt>{props.labels.tickets}</dt><dd>{props.ticketsSold?.toString() ?? "—"}</dd></div>
      </dl>
      <p className="pool-indicator__note">{props.content.informational}</p>
    </div>
  );
}
