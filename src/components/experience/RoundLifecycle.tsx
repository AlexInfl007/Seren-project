import { Check, Circle, Radio } from "lucide-react";
import type { CeremonyContent } from "@/i18n/ceremonyContent";
import { roundLifecycleStep } from "@/lib/roundExperience";
import type { RoundStatus } from "@/config/contract";

export default function RoundLifecycle({ status, content }: { status?: RoundStatus; content: CeremonyContent["lifecycle"] }) {
  const current = roundLifecycleStep(status);
  return (
    <section className="round-lifecycle" aria-labelledby="lifecycle-title">
      <div className="round-lifecycle__heading">
        <span className="eyebrow">{content.eyebrow}</span>
        <h2 id="lifecycle-title">{content.title}</h2>
        <p>{content.intro}</p>
      </div>
      <ol className="round-lifecycle__track">
        {content.stages.map((stage, index) => {
          const stageState = index < current ? "completed" : index === current ? "current" : "future";
          return (
            <li className={`lifecycle-step lifecycle-step--${stageState}`} key={stage.title} aria-current={stageState === "current" ? "step" : undefined}>
              <details open={stageState === "current"}>
                <summary>
                  <span className="lifecycle-step__icon" aria-hidden="true">{stageState === "completed" ? <Check /> : stageState === "current" ? <Radio /> : <Circle />}</span>
                  <span><small>{content[stageState]}</small><strong>{stage.title}</strong></span>
                </summary>
                <p>{stage.body}</p>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
