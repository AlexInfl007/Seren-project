import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoundStatus } from "@/config/contract";
import RoundLifecycle from "@/components/experience/RoundLifecycle";
import { ceremonyContent } from "@/i18n/ceremonyContent";

describe("RoundLifecycle", () => {
  it("marks only the contract-derived current stage", () => {
    render(<RoundLifecycle status={RoundStatus.RANDOMNESS_READY} content={ceremonyContent.en.lifecycle} />);
    expect(screen.getByText("Finalization").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Chainlink VRF").closest("li")).toHaveClass("lifecycle-step--completed");
    expect(screen.getByText("Prize claims").closest("li")).toHaveClass("lifecycle-step--future");
  });
});
