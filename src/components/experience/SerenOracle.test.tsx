import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SerenOracle from "@/components/experience/SerenOracle";

const request = vi.fn();
vi.mock("@/components/providers/WalletProvider", () => ({
  useWalletContext: () => ({ account: undefined, provider: { request } }),
}));

describe("SerenOracle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    request.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("opens without any wallet transaction or signature request", async () => {
    render(<SerenOracle locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Get a prediction" }));
    await act(async () => vi.advanceTimersByTime(600));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Your prediction")).toBeInTheDocument();
    expect(document.querySelector(".oracle-prediction")).toBeInTheDocument();
    expect(document.querySelector(".oracle-share-card")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    for (const method of ["eth_sendTransaction", "personal_sign", "eth_sign", "eth_signTypedData"]) {
      expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ method }));
    }
  });

  it("closes on Escape and returns focus to the trigger", () => {
    render(<SerenOracle locale="en" />);
    const trigger = screen.getByRole("button", { name: "Get a prediction" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
