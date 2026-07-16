import type { Eip1193Provider, WalletProviderInfo } from "@/lib/eip1193";

const providerIds = new WeakMap<object, string>();
let providerSequence = 0;

function legacyProviderName(provider: Eip1193Provider) {
  if (provider.isRabby) return "Rabby Wallet";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isTrust) return "Trust Wallet";
  if (provider.isPhantom) return "Phantom";
  if (provider.isBraveWallet) return "Brave Wallet";
  if (provider.isOKExWallet) return "OKX Wallet";
  if (provider.isTokenPocket) return "TokenPocket";
  if (provider.isMetaMask) return "MetaMask";
  return "Browser wallet";
}

function legacyProviderId(provider: Eip1193Provider) {
  const objectProvider = provider as object;
  const existing = providerIds.get(objectProvider);
  if (existing) return existing;
  providerSequence += 1;
  const id = `injected-${providerSequence}`;
  providerIds.set(objectProvider, id);
  return id;
}

function walletIdentity(provider: WalletProviderInfo) {
  const rdns = provider.rdns?.trim().toLowerCase();
  const name = provider.name.trim().toLowerCase();
  const knownWallets = [
    "metamask",
    "rabby",
    "coinbase",
    "trust",
    "phantom",
    "brave",
    "okx",
    "tokenpocket",
  ];
  const known = knownWallets.find((wallet) => rdns?.includes(wallet) || name.includes(wallet));
  if (known) return `wallet:${known}`;
  if (rdns) return `rdns:${rdns}`;
  if (name && name !== "browser wallet") return `name:${name}`;
  return undefined;
}

export function uniqueProviders(providers: WalletProviderInfo[]) {
  const result: WalletProviderInfo[] = [];
  providers.forEach((candidate) => {
    const candidateIdentity = walletIdentity(candidate);
    const existingIndex = result.findIndex(
      (item) => item.provider === candidate.provider
        || item.id === candidate.id
        || (candidateIdentity !== undefined && walletIdentity(item) === candidateIdentity),
    );
    if (existingIndex === -1) {
      result.push(candidate);
      return;
    }

    const existing = result[existingIndex];
    const candidateHasMetadata = Boolean(candidate.rdns || candidate.icon);
    const existingHasMetadata = Boolean(existing.rdns || existing.icon);
    if (candidateHasMetadata && !existingHasMetadata) result[existingIndex] = candidate;
  });
  return result;
}

export function discoverInjectedProviders() {
  if (typeof window === "undefined") return [];
  const ethereum = window.ethereum;
  if (!ethereum) return [];

  const sources = ethereum.providers?.length
    ? ethereum.providers
    : [ethereum.selectedProvider || ethereum];
  return uniqueProviders(sources.map((provider) => ({
    id: legacyProviderId(provider),
    name: legacyProviderName(provider),
    provider,
  })));
}

export async function requestProviderAccounts(provider: Eip1193Provider) {
  try {
    const authorized = await provider.request<string[]>({ method: "eth_accounts" });
    if (authorized.length > 0) return authorized;
  } catch {
    // Some privacy-focused providers reject silent account checks. A user click
    // still authorizes the interactive standards-based request below.
  }

  // This runs only after a user click. New browser profiles need the permission
  // request so the wallet can show its unlock/approval interface.
  return provider.request<string[]>({ method: "eth_requestAccounts" });
}
