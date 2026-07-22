"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Copy, Menu, ShieldCheck, Wallet, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import Brand from "@/components/layout/Brand";
import Container from "@/components/layout/Container";
import { useWalletContext } from "@/components/providers/WalletProvider";
import { localeShortLabels, locales, localeToDashboardLanguage, type Locale } from "@/i18n/locales";
import type { SiteContent } from "@/i18n/siteContent";
import { translations } from "@/i18n/translations";
import { shortenAddress } from "@/lib/format";

function walletConnectConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
}

export default function Header({ locale, content }: { locale: Locale; content: SiteContent }) {
  const wallet = useWalletContext();
  const router = useRouter();
  const pathname = usePathname();
  const ui = translations[localeToDashboardLanguage[locale]];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const walletButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const walletId = useId();
  const links = [
    [content.nav.home, "home"], [content.nav.lottery, "lottery"], [content.nav.how, "how-it-works"],
    [content.nav.winners, "winners"], [content.nav.transparency, "transparency"], [content.nav.faq, "faq"],
  ] as const;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      if (walletOpen) {
        setWalletOpen(false);
        walletButtonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setWalletOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [walletOpen]);

  useEffect(() => {
    const openWallet = () => {
      setMobileOpen(false);
      setWalletOpen(true);
    };
    window.addEventListener("seren:open-wallet", openWallet);
    return () => window.removeEventListener("seren:open-wallet", openWallet);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", mobileOpen);
    return () => document.body.classList.remove("menu-open");
  }, [mobileOpen]);

  const changeLocale = (next: Locale) => {
    const suffix = pathname.replace(/^\/(en|ru|es|zh|hi|ar|fr|pt)/, "") || "";
    router.push(`/${next}${suffix}${window.location.hash}`);
  };

  return (
    <header className="premium-header" ref={rootRef}>
      <Container className="header-inner">
        <Brand locale={locale} compact />
        <nav className="desktop-navigation" aria-label={content.footer.navigation}>
          {links.map(([label, anchor]) => <Link href={`/${locale}#${anchor}`} key={anchor}>{label}</Link>)}
        </nav>
        <div className="header-controls">
          <label className="language-control">
            <span className="sr-only">{content.language}</span>
            <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)} aria-label={content.language}>
              {locales.map((item) => <option value={item} key={item}>{localeShortLabels[item]}</option>)}
            </select>
          </label>
          <button ref={walletButtonRef} type="button" className="button button--outline header-wallet" aria-expanded={walletOpen} aria-controls={walletId} aria-busy={wallet.connecting} onClick={() => { setWalletOpen((value) => !value); setMobileOpen(false); }}>
            <Wallet aria-hidden="true" />
            <span aria-live="polite">{wallet.account ? shortenAddress(wallet.account) : wallet.connecting ? ui.wallet.connecting : ui.wallet.connect}</span>
          </button>
          <button type="button" className="icon-control mobile-menu-button" aria-label={mobileOpen ? ui.wallet.close : ui.wallet.menu} aria-expanded={mobileOpen} aria-controls={menuId} onClick={() => { setMobileOpen((value) => !value); setWalletOpen(false); }}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        {walletOpen && (
          <div className="wallet-menu" id={walletId} role="dialog" aria-label={content.nav.lottery}>
            {wallet.account ? <>
              <div className="wallet-menu__status"><span className="status-orb status-orb--live" /><strong>{shortenAddress(wallet.account)}</strong></div>
              <p className="break-address">{wallet.account}</p>
              <button type="button" onClick={wallet.copyAddress}><Copy />{wallet.copied ? ui.wallet.copied : ui.wallet.copy}</button>
              {!wallet.isPolygon && <button type="button" onClick={wallet.switchToPolygon}><ShieldCheck />{ui.wallet.switch}</button>}
              <button type="button" onClick={wallet.disconnect}><X />{ui.wallet.disconnect}</button>
            </> : <>
              <strong>{ui.wallet.select}</strong>
              {wallet.providers.map((provider) => <button type="button" key={provider.id} onClick={() => wallet.connectWithProvider(provider)}><Wallet />{provider.name || ui.wallet.browser}</button>)}
              {walletConnectConfigured() && <button type="button" onClick={wallet.connectWalletConnect}><Wallet />WalletConnect</button>}
              {wallet.providers.length === 0 && !walletConnectConfigured() && <p>{ui.wallet.unavailable}</p>}
            </>}
            {wallet.error && <p className="inline-error" role="status" aria-live="polite">{ui.errors[wallet.error.key]}</p>}
          </div>
        )}
      </Container>
      {mobileOpen && <nav id={menuId} className="mobile-navigation is-open" aria-label={content.footer.navigation}>
        <Container>{links.map(([label, anchor]) => <Link href={`/${locale}#${anchor}`} key={anchor} onClick={() => setMobileOpen(false)}>{label}</Link>)}</Container>
      </nav>}
    </header>
  );
}
