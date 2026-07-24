import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Address } from "viem";
import RoundFinalizationReveal from "@/components/experience/RoundFinalizationReveal";
import { ceremonyContent } from "@/i18n/ceremonyContent";
import type { RoundResult } from "@/lib/contractReads";

const winner = "0x0C59B1c64925425AB307Cc19A92AD176E0709360" as Address;
const results: RoundResult[] = Array.from({ length: 10 }, (_, index) => ({
  place: index + 1,
  winner,
  prize: BigInt(10 - index) * 10n ** 18n,
  ticketId: BigInt(100 + index),
  claimed: index > 0,
}));

describe("RoundFinalizationReveal", () => {
  it("keeps the canonical place order in the DOM and supports skip", () => {
    render(<RoundFinalizationReveal results={results} roundId={3n} account={winner} content={ceremonyContent.en.reveal} onClaim={vi.fn()} claimPending={false} />);
    const positions = screen.getAllByRole("listitem");
    expect(positions[0]).toHaveTextContent("#1");
    expect(positions[9]).toHaveTextContent("#10");
    fireEvent.click(screen.getByRole("button", { name: ceremonyContent.en.reveal.skip }));
    expect(screen.getByText(ceremonyContent.en.reveal.complete)).toBeInTheDocument();
  });

  it("offers claim only to the matching owner of an unclaimed result", () => {
    const claim = vi.fn();
    const { rerender } = render(<RoundFinalizationReveal results={results} roundId={3n} account={winner} content={ceremonyContent.en.reveal} onClaim={claim} claimPending={false} />);
    fireEvent.click(screen.getByRole("button", { name: ceremonyContent.en.reveal.claim }));
    expect(claim).toHaveBeenCalledWith(3n);
    rerender(<RoundFinalizationReveal results={results} roundId={3n} account={"0x0000000000000000000000000000000000000001"} content={ceremonyContent.en.reveal} onClaim={claim} claimPending={false} />);
    expect(screen.queryByRole("button", { name: ceremonyContent.en.reveal.claim })).not.toBeInTheDocument();
  });
});
