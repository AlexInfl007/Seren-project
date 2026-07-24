import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProofExplorer from "@/components/experience/ProofExplorer";
import { ceremonyContent } from "@/i18n/ceremonyContent";
import { experienceContent } from "@/i18n/experienceContent";
import type { ActivityEntry } from "@/lib/contractHistory";

const purchase: ActivityEntry = {
  id: "purchase",
  eventName: "TicketPurchased",
  transactionHash: "0x123400000000000000000000000000000000000000000000000000000000abcd",
  blockNumber: 90588222n,
  roundId: 1n,
  explorerUrl: "https://polygonscan.com/tx/0x123400000000000000000000000000000000000000000000000000000000abcd",
};

describe("ProofExplorer", () => {
  it("shows only confirmed event evidence and honest pending states", () => {
    render(<ProofExplorer activity={[purchase]} roundId={1n} content={ceremonyContent.en.proof} activityLabels={experienceContent.en.activity} />);
    expect(screen.getByText("Ticket purchase").closest("li")).toHaveClass("has-evidence");
    expect(screen.getByText("Chainlink callback").closest("li")).toHaveClass("is-awaiting");
    expect(screen.getByRole("link", { name: /PolygonScan/ })).toHaveAttribute("href", purchase.explorerUrl);
  });
});
