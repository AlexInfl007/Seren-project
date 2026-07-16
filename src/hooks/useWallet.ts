"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWalletClient, custom, getAddress, type Address, type Hex } from "viem";
import {
  POLYGON_CHAIN_ID,
  POLYGON_CHAIN_ID_HEX,
  POLYGON_CHAIN,
} from "@/config/contract";
import type { Eip1193Provider, WalletProviderInfo } from "@/lib/eip1193";
import { normalizeContractError, type AppError } from "@/lib/contractErrors";
import { discoverInjectedProviders, requestProviderAccounts, uniqueProviders } from "@/lib/walletProviders";

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

function isMobileDevice() {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function useWallet() {
  const restoreStarted = useRef(false);
  const providersRef = useRef<WalletProviderInfo[]>([]);
  const [state, setState] = useState<WalletState>({
    providers: [],
    connecting: false,
    copied: false,
    explicitConnection: false,
  });

  const refreshProviders = useCallback(() => {
    const providers = uniqueProviders([...providersRef.current, ...discoverInjectedProviders()]);
    providersRef.current = providers;
    setState((current) => ({
      ...current,
      providers,
    }));
  }, []);

  useEffect(() => {
    refreshProviders();

    const onAnnounce = (event: Event) => {
      const detail = (event as Eip6963AnnounceEvent).detail;
      if (!detail?.provider || typeof detail.provider.request !== "function" || !detail.info?.uuid) return;
      const providers = uniqueProviders([
        ...providersRef.current,
        {
          id: detail.info.uuid,
          name: detail.info.name,
          icon: detail.info.icon,
          rdns: detail.info.rdns,
          provider: detail.provider,
        },
      ]);
      providersRef.current = providers;
      setState((current) => ({
        ...current,
        providers,
      }));
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.addEventListener("ethereum#initialized", refreshProviders);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const retryTimers = [250, 1_000, 2_500].map((delay) => window.setTimeout(refreshProviders, delay));
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      window.removeEventListener("ethereum#initialized", refreshProviders);
      retryTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [refreshProviders]);

  useEffect(() => {
    if (restoreStarted.current || state.provider || state.providers.length === 0) return;
    const savedProviderId = window.sessionStorage.getItem("seren.wallet.provider");
    const shouldRestore = window.sessionStorage.getItem("seren.wallet.connected") === "1";
    if (!shouldRestore || !savedProviderId) return;
    const providerInfo = state.providers.find((item) => item.id === savedProviderId);
    if (!providerInfo) return;

    restoreStarted.current = true;
    void (async () => {
      try {
        const accounts = await providerInfo.provider.request<string[]>({ method: "eth_accounts" });
        const [account] = accounts;
        if (!account) {
          window.sessionStorage.removeItem("seren.wallet.connected");
          window.sessionStorage.removeItem("seren.wallet.provider");
          return;
        }
        const chainId = await providerInfo.provider.request<string>({ method: "eth_chainId" });
        setState((current) => ({
          ...current,
          provider: providerInfo.provider,
          account: getAddress(account),
          chainId: chainHexToNumber(chainId),
          explicitConnection: true,
          error: undefined,
        }));
      } catch {
        window.sessionStorage.removeItem("seren.wallet.connected");
        window.sessionStorage.removeItem("seren.wallet.provider");
      }
    })();
  }, [state.provider, state.providers]);

  useEffect(() => {
    if (!state.provider) return;

    const onAccountsChanged = (accounts: unknown) => {
      const [next] = Array.isArray(accounts) ? accounts : [];
      if (!next) {
        window.sessionStorage.removeItem("seren.wallet.connected");
        window.sessionStorage.removeItem("seren.wallet.provider");
      }
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
      const accounts = await requestProviderAccounts(provider);
      const [account] = accounts;
      if (!account) {
        setState((current) => ({
          ...current,
          connecting: false,
          error: { key: "noAccounts" },
        }));
        return;
      }
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
      window.sessionStorage.setItem("seren.wallet.connected", "1");
      window.sessionStorage.setItem("seren.wallet.provider", providerInfo?.id || "injected-0");
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
      if (!accounts[0]) throw new Error("Wallet returned no accounts");
      const chainId = await provider.request<string>({ method: "eth_chainId" });
      setState((current) => ({
        ...current,
        provider,
        account: getAddress(accounts[0]),
        chainId: chainHexToNumber(chainId),
        connecting: false,
        explicitConnection: true,
      }));
      window.sessionStorage.setItem("seren.wallet.connected", "1");
      window.sessionStorage.setItem("seren.wallet.provider", "walletconnect");
    } catch (error) {
      setState((current) => ({
        ...current,
        connecting: false,
        error: normalizeContractError(error),
      }));
    }
  }, []);

  const openMetaMaskMobile = useCallback(() => {
    if (typeof window === "undefined") return;
    const dappUrl = `${window.location.host}${window.location.pathname}${window.location.search}`;
    window.location.assign(`https://metamask.app.link/dapp/${dappUrl}`);
  }, []);

  const connectPreferred = useCallback(async () => {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const available = uniqueProviders([...providersRef.current, ...discoverInjectedProviders()]);
    providersRef.current = available;
    setState((current) => ({ ...current, providers: available }));
    const metaMask = available.find(
      (item) => item.name.toLowerCase().includes("metamask") || item.rdns?.toLowerCase().includes("metamask"),
    );

    if (metaMask) {
      await connectWithProvider(metaMask);
      return;
    }

    if (isMobileDevice()) {
      if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
        await connectWalletConnect();
        return;
      }
      openMetaMaskMobile();
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

    setState((current) => ({ ...current, error: { key: "walletUnavailable" } }));
  }, [connectWalletConnect, connectWithProvider, openMetaMaskMobile]);

  const switchToPolygon = useCallback(async () => {
    if (!state.provider) return;
    try {
      await state.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
      });
      setState((current) => ({ ...current, chainId: POLYGON_CHAIN_ID, error: undefined }));
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? Number((error as { code?: unknown }).code)
        : undefined;
      if (code === 4902) {
        try {
          await state.provider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: POLYGON_CHAIN_ID_HEX,
              chainName: POLYGON_CHAIN.name,
              nativeCurrency: POLYGON_CHAIN.nativeCurrency,
              rpcUrls: [...POLYGON_CHAIN.rpcUrls.default.http],
              blockExplorerUrls: [POLYGON_CHAIN.blockExplorers.default.url],
            }],
          });
          await state.provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
          });
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
    window.sessionStorage.removeItem("seren.history.v1");
    window.sessionStorage.removeItem("seren.wallet.connected");
    window.sessionStorage.removeItem("seren.wallet.provider");
  }, []);

  const walletClient = useMemo(() => {
    if (!state.provider || !state.account) return undefined;
    return createWalletClient({
      account: state.account,
      chain: POLYGON_CHAIN,
      transport: custom(state.provider),
    });
  }, [state.provider, state.account]);

  return {
    ...state,
    walletClient,
    isPolygon: state.chainId === POLYGON_CHAIN_ID,
    isMobile: isMobileDevice(),
    connectWithProvider,
    connectWalletConnect,
    connectPreferred,
    openMetaMaskMobile,
    switchToPolygon,
    copyAddress,
    disconnect,
  };
}
