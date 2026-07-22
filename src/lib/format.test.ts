import { parseEther } from "viem";
import { describe, expect, it } from "vitest";
import { formatCount, formatPol, shortenAddress } from "@/lib/format";

describe("format helpers", () => {
  it("formats POL without excessive decimals", () => {
    expect(formatPol(parseEther("30"))).toBe("30 POL");
    expect(formatPol(parseEther("1.234567"))).toBe("1.2345 POL");
  });

  it("formats counts and addresses", () => {
    expect(formatCount(12345n)).toBe("12,345");
    expect(shortenAddress("0x0C59B1c64925425AB307Cc19A92AD176E0709360")).toBe("0x0C59…9360");
  });
});
