"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createWalletClient, custom, getAddress, type Address, type Hex } from "viem";
import { polygon } from "viem/chains";
import {
  HISTORY_SCAN_CONFIG,
  POLYGON_CHAIN_ID,
  POLYGON_CHAIN_ID_HEX,
} from "@/config/contract";
import type { Eip1193Provider, WalletProviderInfo } from "@/lib/eip1193";
import { normalizeContractError, type AppError } from "@/lib/contractErrors";

type Eip6963AnnounceEvent = CustomEvent<{
  info: { uuid: string; name: string; icon?: string; rdns?: string };
  provider: Eip1193Provider;
}>;

export type WalletState = {
  account?: Address;
  chainId?: number;
  provider?: Eip1193Provider;
  providers: WalletProviderInfo[];
  connecting: boolean;
  error?: AppError;
  copied: boolean;
  explicitConnection: boolean;
};

function chainHexToNumber(chainId: string | number): number {
  if (typeof chainId === "number") return chainId;
  return Number.parseInt(chainId, 16);
}

function uniqueProviders(providers: WalletProviderInfo[]) {
  const map = new Map<string, WalletProviderInfo>();
  providers.forEach((provider) => map.set(provider.id, provider));
  return [...map.values()];
}

function discoverInjectedProviders() {
  if (typeof window === "undefined") return [];
  const ethereum = window.ethereum;
  if (!ethereum) return [];

  const sources = ethereum.providers?.length ? ethereum.providers : [ethereum.selectedProvider || ethereum];
  return sources.map((provider, index) => ({
    id: provider.isMetaMask ? "metamask" : `injected-${index}`,
    name: provider.isMetaMask ? "MetaMask" : "Browser wallet",
    provider,
  }));
}

export function isMobileWalletBrowser(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent) {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function metaMaskDappLink(location: Pick<Location, "host" | "pathname" | "search">) {
  return `https://metamask.app.link/dapp/${location.host}${location.pathname}${location.search}`;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    providers: [],
    connecting: false,
    copied: false,
    explicitConnection: false,
  });

  const refreshProviders = useCallback(() => {
    setState((current) => ({
      ...current,
      providers: uniqueProviders([...current.providers, ...discoverInjectedProviders()]),
    }));
  }, []);

  useEffect(() => {
    refreshProviders();

    const onAnnounce = (event: Event) => {
      const detail = (event as Eip6963AnnounceEvent).detail;
      setState((current) => ({
        ...current,
        providers: uniqueProviders([
          ...current.providers,
          {
            id: detail.info.uuid,
            name: detail.info.name,
            icon: detail.info.icon,
            rdns: detail.info.rdns,
            provider: detail.provider,
          },
        ]),
      }));
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, [refreshProviders]);

  useEffect(() => {
    if (!state.provider) return;

    const onAccountsChanged = (accounts: unknown) => {
      const [next] = Array.isArray(accounts) ? accounts : [];
      setState((current) => ({
        ...current,
        account: typeof next === "string" ? getAddress(next) : undefined,
        explicitConnection: Boolean(next),
      }));
    };

    const onChainChanged = (chainId: unknown) => {
      setState((current) => ({
        ...current,
        chainId: typeof chainId === "string" || typeof chainId === "number" ? chainHexToNumber(chainId) : undefined,
      }));
    };

    state.provider.on?.("accountsChanged", onAccountsChanged);
    state.provider.on?.("chainChanged", onChainChanged);
    return () => {
      state.provider?.removeListener?.("accountsChanged", onAccountsChanged);
      state.provider?.removeListener?.("chainChanged", onChainChanged);
    };
  }, [state.provider]);

  const connectWithProvider = useCallback(async (providerInfo?: WalletProviderInfo) => {
    const provider = providerInfo?.provider || discoverInjectedProviders()[0]?.provider;
    if (!provider) {
      setState((current) => ({ ...current, error: { key: "walletUnavailable" } }));
      return;
    }

    setState((current) => ({ ...current, connecting: true, error: undefined }));
    try {
      const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
      const [account] = accounts;
      if (!account) throw new Error("No accounts returned");
      const chainId = await provider.request<string>({ method: "eth_chainId" });
      setState((current) => ({
        ...current,
        provider,
        account: getAddress(account),
        chainId: chainHexToNumber(chainId),
        connecting: false,
        explicitConnection: true,
        error: undefined,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        connecting: false,
        error: normalizeContractError(error),
      }));
    }
  }, []);

  const connectWalletConnect = useCallback(async () => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      setState((current) => ({ ...current, error: { key: "walletUnavailable" } }));
      return;
    }

    setState((current) => ({ ...current, connecting: true, error: undefined }));
    try {
      const { default: EthereumProvider } = await import("@walletconnect/ethereum-provider");
      const provider = (await EthereumProvider.init({
        projectId,
        chains: [POLYGON_CHAIN_ID],
        optionalChains: [POLYGON_CHAIN_ID],
        showQrModal: true,
        metadata: {
          name: "Seren Lottery Chain",
          description: "Transparent Polygon lottery interface",
          url: window.location.origin,
          icons: [`${window.location.origin}/assets/logo.png`],
        },
      })) as unknown as Eip1193Provider & { enable?: () => Promise<string[]> };

      const accounts = provider.enable
        ? await provider.enable()
        : await provider.request<string[]>({ method: "eth_requestAccounts" });
      const chainId = await provider.request<string>({ method: "eth_chainId" });
      setState((current) => ({
        ...current,
        provider,
        account: getAddress(accounts[0]),
        chainId: chainHexToNumber(chainId),
        connecting: false,
        explicitConnection: true,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        connecting: false,
        error: normalizeContractError(error),
      }));
    }
  }, []);

  const openMetaMaskMobile = useCallback(() => {
    window.location.assign(metaMaskDappLink(window.location));
  }, []);

  const connectPreferred = useCallback(async () => {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const available = uniqueProviders([...state.providers, ...discoverInjectedProviders()]);
    const metaMask = available.find(
      (provider) => provider.provider.isMetaMask
        || provider.name.toLowerCase().includes("metamask")
        || provider.rdns?.toLowerCase().includes("metamask"),
    );

    if (metaMask) {
      await connectWithProvider(metaMask);
      return;
    }

    if (available[0]) {
      await connectWithProvider(available[0]);
      return;
    }

    if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
      await connectWalletConnect();
      return;
    }

    if (isMobileWalletBrowser()) {
      openMetaMaskMobile();
      return;
    }

    setState((current) => ({ ...current, error: { key: "walletUnavailable" } }));
  }, [connectWalletConnect, connectWithProvider, openMetaMaskMobile, state.providers]);

  const switchToPolygon = useCallback(async () => {
    if (!state.provider) return;
    try {
      await state.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
      });
      setState((current) => ({ ...current, chainId: POLYGON_CHAIN_ID, error: undefined }));
    } catch (error) {
      const code = typeof error === "object" && error ? (error as { code?: number }).code : undefined;
      if (code === 4902) {
        try {
          await state.provider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: POLYGON_CHAIN_ID_HEX,
              chainName: "Polygon Mainnet",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              blockExplorerUrls: ["https://polygonscan.com"],
            }],
          });
          await state.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON_CHAIN_ID_HEX }] });
          setState((current) => ({ ...current, chainId: POLYGON_CHAIN_ID, error: undefined }));
          return;
        } catch (addError) {
          setState((current) => ({ ...current, error: normalizeContractError(addError) }));
          return;
        }
      }
      setState((current) => ({ ...current, error: normalizeContractError(error) }));
    }
  }, [state.provider]);

  const copyAddress = useCallback(async () => {
    if (!state.account) return;
    await navigator.clipboard.writeText(state.account);
    setState((current) => ({ ...current, copied: true }));
    window.setTimeout(() => setState((current) => ({ ...current, copied: false })), 1400);
  }, [state.account]);

  const disconnect = useCallback(() => {
    setState((current) => ({
      ...current,
      account: undefined,
      provider: undefined,
      chainId: undefined,
      explicitConnection: false,
      error: undefined,
    }));
    window.sessionStorage.removeItem(HISTORY_SCAN_CONFIG.sessionKey);
  }, []);

  const walletClient = useMemo(() => {
    if (!state.provider || !state.account) return undefined;
    return createWalletClient({
      account: state.account,
      chain: polygon,
      transport: custom(state.provider),
    });
  }, [state.provider, state.account]);

  return {
    ...state,
    walletClient,
    isPolygon: state.chainId === POLYGON_CHAIN_ID,
    isMobile: isMobileWalletBrowser(),
    connectWithProvider,
    connectWalletConnect,
    connectPreferred,
    switchToPolygon,
    copyAddress,
    disconnect,
  };
}
