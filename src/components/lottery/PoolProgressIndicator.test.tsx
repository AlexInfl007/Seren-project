import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PoolProgressIndicator from "@/components/lottery/PoolProgressIndicator";
import { experienceContent } from "@/i18n/experienceContent";

const labels = { round: "Round", status: "Status", ticketPrice: "Ticket price", tickets: "Tickets" };

describe("PoolProgressIndicator", () => {
  it("shows an honest disconnected state without blockchain values", () => {
    const { container } = render(<PoolProgressIndicator status="disconnected" content={experienceContent.en.pool} labels={labels} />);
    expect(screen.getByText(experienceContent.en.pool.connect)).toBeInTheDocument();
    expect(container).not.toHaveTextContent("12 480");
    expect(container.querySelector("[data-state='disconnected']")).toBeInTheDocument();
  });

  it("renders capped live progress and the source block", () => {
    render(<PoolProgressIndicator status="loaded" currentPool={125n} targetPool={100n} roundId={4n} roundStatus="Open" ticketPrice={30n} ticketsSold={12n} lastUpdatedBlock={900n} content={experienceContent.en.pool} labels={labels} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText(/block 900/i)).toBeInTheDocument();
    expect(screen.getByText(/Polygon Mainnet/i)).toBeInTheDocument();
  });
});
