import { describe, expect, it, vi } from "vitest";
import type { Eip1193Provider, WalletProviderInfo } from "@/lib/eip1193";
import { requestProviderAccounts, uniqueProviders } from "@/lib/walletProviders";

describe("wallet provider compatibility", () => {
  it("requests permission when a new browser profile has no authorized account", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(["0x5916b50c383ab3732c4896a7efadd155f00ff01f"]);

    const accounts = await requestProviderAccounts({ request } as Eip1193Provider);

    expect(accounts).toHaveLength(1);
    expect(request).toHaveBeenNthCalledWith(1, { method: "eth_accounts" });
    expect(request).toHaveBeenNthCalledWith(2, { method: "eth_requestAccounts" });
  });

  it("does not reopen the wallet when the site is already authorized", async () => {
    const request = vi.fn().mockResolvedValue(["0x5916b50c383ab3732c4896a7efadd155f00ff01f"]);

    await requestProviderAccounts({ request } as Eip1193Provider);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({ method: "eth_accounts" });
  });

  it("uses the interactive request when a privacy wallet blocks silent discovery", async () => {
    const request = vi.fn()
      .mockRejectedValueOnce({ code: 4100 })
      .mockResolvedValueOnce(["0x5916b50c383ab3732c4896a7efadd155f00ff01f"]);

    const accounts = await requestProviderAccounts({ request } as Eip1193Provider);

    expect(accounts).toHaveLength(1);
    expect(request).toHaveBeenNthCalledWith(2, { method: "eth_requestAccounts" });
  });

  it("prefers EIP-6963 metadata and removes duplicate injected providers", () => {
    const provider = { request: vi.fn() } as unknown as Eip1193Provider;
    const legacy: WalletProviderInfo = { id: "injected-1", name: "Browser wallet", provider };
    const announced: WalletProviderInfo = {
      id: "wallet-uuid",
      name: "Example Wallet",
      rdns: "com.example.wallet",
      provider,
    };

    expect(uniqueProviders([legacy, announced])).toEqual([announced]);
  });

  it("removes MetaMask announced through two different provider wrappers", () => {
    const legacy: WalletProviderInfo = {
      id: "injected-1",
      name: "MetaMask",
      provider: { request: vi.fn(), isMetaMask: true },
    };
    const announced: WalletProviderInfo = {
      id: "metamask-uuid",
      name: "MetaMask",
      rdns: "io.metamask",
      provider: { request: vi.fn(), isMetaMask: true },
    };

    expect(uniqueProviders([legacy, announced])).toEqual([announced]);
    expect(uniqueProviders([announced, legacy])).toEqual([announced]);
  });

  it("keeps separate unnamed legacy wallets when their identity is unknown", () => {
    const first: WalletProviderInfo = { id: "injected-1", name: "Browser wallet", provider: { request: vi.fn() } };
    const second: WalletProviderInfo = { id: "injected-2", name: "Browser wallet", provider: { request: vi.fn() } };

    expect(uniqueProviders([first, second])).toHaveLength(2);
  });
});
