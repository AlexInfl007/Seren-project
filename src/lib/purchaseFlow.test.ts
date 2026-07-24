import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseQuoteStatus } from "@/config/contract";

const preparePurchaseQuote = vi.fn();
const simulateTicketPurchase = vi.fn();
vi.mock("@/lib/contractReads", () => ({ preparePurchaseQuote, simulateTicketPurchase }));

const account = "0x4fC74bD2945b6CD98172880330ddACBA3F846742" as const;
const prepared = { quantity: 10, creditsToUse: 2, roundId: 3n, deadline: 1000n, quote: { canPurchase: true, status: PurchaseQuoteStatus.OK, requiredPayment: 270n, ticketPrice: 30n, discountedTicketPrice: 15n, availableCredits: 2n, resultingTicketCount: 10n } };

describe("safe purchase flow", () => {
  beforeEach(() => { vi.clearAllMocks(); preparePurchaseQuote.mockResolvedValue({ roundId: 3n, deadline: 1200n, quote: { ...prepared.quote, requiredPayment: 275n } }); simulateTicketPurchase.mockResolvedValue({ request: { value: 275n } }); });

  it("re-quotes, simulates, uses requiredPayment, then waits for a successful receipt", async () => {
    const { executeTicketPurchase } = await import("@/lib/purchaseFlow");
    const writeContract = vi.fn().mockResolvedValue("0xabc");
    const waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: "success" });
    const ensureContext = vi.fn();
    await executeTicketPurchase({ client: { waitForTransactionReceipt } as never, walletClient: { writeContract } as never, account, prepared, ensureContext });
    expect(preparePurchaseQuote).toHaveBeenCalledOnce();
    expect(simulateTicketPurchase).toHaveBeenCalledWith(expect.objectContaining({ value: 275n, quantity: 10, creditsToUse: 2 }));
    expect(writeContract).toHaveBeenCalledAfter(simulateTicketPurchase);
    expect(ensureContext).toHaveBeenCalledTimes(2);
  });

  it("does not write when simulation fails", async () => {
    const { executeTicketPurchase } = await import("@/lib/purchaseFlow");
    simulateTicketPurchase.mockRejectedValueOnce(new Error("simulation reverted"));
    const writeContract = vi.fn();
    await expect(executeTicketPurchase({ client: {} as never, walletClient: { writeContract } as never, account, prepared, ensureContext: vi.fn() })).rejects.toThrow("simulation reverted");
    expect(writeContract).not.toHaveBeenCalled();
  });

  it("validates quantity and referral credit bounds", async () => {
    const { validatePurchaseIntent } = await import("@/lib/purchaseFlow");
    expect(validatePurchaseIntent({ quantity: 0, creditsToUse: 0 }, 0n)).toBe("quantity");
    expect(validatePurchaseIntent({ quantity: 101, creditsToUse: 0 }, 0n)).toBe("quantity");
    expect(validatePurchaseIntent({ quantity: 5, creditsToUse: 6 }, 10n)).toBe("credits");
    expect(validatePurchaseIntent({ quantity: 5, creditsToUse: 2 }, 1n)).toBe("credits");
    expect(validatePurchaseIntent({ quantity: 100, creditsToUse: 10 }, 10n)).toBeUndefined();
  });
});
