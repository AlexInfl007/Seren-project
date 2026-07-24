import { describe, expect, it } from "vitest";
import { isMobileWalletBrowser, metaMaskDappLink } from "@/hooks/useWallet";

describe("mobile wallet routing", () => {
  it("recognizes common mobile browsers", () => {
    expect(isMobileWalletBrowser("Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36")).toBe(true);
    expect(isMobileWalletBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X)")).toBe(true);
    expect(isMobileWalletBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
  });

  it("builds a MetaMask DApp browser link for the current localized page", () => {
    expect(metaMaskDappLink({
      host: "serenlotterychain.com",
      pathname: "/ru",
      search: "?ref=0x1234",
    })).toBe("https://metamask.app.link/dapp/serenlotterychain.com/ru?ref=0x1234");
  });
});
