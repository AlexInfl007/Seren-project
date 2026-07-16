import { parseEther } from "viem";
import { describe, expect, it } from "vitest";
import { formatCount, formatPol, formatTimestamp, shortenAddress } from "@/lib/format";

describe("format helpers", () => {
  it("formats POL without excessive decimals", () => {
    expect(formatPol(parseEther("30"))).toBe("30 POL");
    expect(formatPol(parseEther("1.234567"))).toBe("1.2345 POL");
  });

  it("formats counts and addresses", () => {
    expect(formatCount(12345n)).toBe("12,345");
    expect(shortenAddress("0xf90169AD413429af4AE0a3B8962648d4a3289011")).toBe("0xf901…9011");
  });

  it("always formats purchase dates in English", () => {
    const formatted = formatTimestamp(Date.UTC(2026, 0, 15, 12, 30), "UTC");
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("UTC");
  });

  it("converts the same purchase moment for the viewer's time zone", () => {
    const timestamp = Date.UTC(2026, 0, 15, 12, 30);
    expect(formatTimestamp(timestamp, "America/New_York")).not.toBe(
      formatTimestamp(timestamp, "Asia/Tokyo"),
    );
  });
});
