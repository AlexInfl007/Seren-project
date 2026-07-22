"use client";

import Image from "next/image";
import { Copy, RefreshCcw, Share2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Container from "@/components/layout/Container";
import { useWalletContext } from "@/components/providers/WalletProvider";
import { experienceContent } from "@/i18n/experienceContent";
import type { Locale } from "@/i18n/locales";
import { createDailyPrediction, createRandomPrediction, type PredictionSelection } from "@/lib/prediction";

export default function SerenOracle({ locale }: { locale: Locale }) {
  const wallet = useWalletContext();
  const content = experienceContent[locale].oracle;
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selection, setSelection] = useState<PredictionSelection>();
  const [shared, setShared] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const generate = async () => {
    setGenerating(true);
    setShared(false);
    const next = wallet.account ? await createDailyPrediction(wallet.account) : createRandomPrediction();
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setSelection(next);
      setGenerating(false);
    }, 520);
  };

  const showOracle = () => {
    setOpen(true);
    void generate();
  };

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])");
    focusable?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);
  const message = selection ? content.messages[selection.messageIndex] : "";
  const symbol = selection ? content.symbols[selection.symbolIndex] : "";

  const share = async () => {
    if (!selection) return;
    const text = `${content.title}: ${message}\n${content.luckyNumber}: ${selection.luckyNumber} · ${content.symbol}: ${symbol}\n${window.location.origin}`;
    try {
      if (navigator.share) await navigator.share({ title: content.title, text, url: window.location.href });
      else await navigator.clipboard.writeText(text);
      setShared(true);
    } catch { /* sharing was cancelled or unavailable */ }
  };

  return (
    <section className="oracle-section" aria-labelledby="oracle-heading">
      <Container>
        <div className="oracle-intro">
          <span className="eyebrow"><Sparkles aria-hidden="true" />{content.eyebrow}</span>
          <h2 id="oracle-heading">{content.title}</h2>
          <p>{content.intro}</p>
          <button ref={triggerRef} type="button" className="button button--oracle" onClick={showOracle}><Sparkles aria-hidden="true" />{content.trigger}</button>
          <small>{content.disclaimer}</small>
        </div>
      </Container>
      {open && (
        <div className="oracle-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div ref={dialogRef} className="oracle-dialog" role="dialog" aria-modal="true" aria-labelledby="oracle-dialog-title" aria-describedby="oracle-disclaimer">
            <button type="button" className="icon-button oracle-close" onClick={close} aria-label={content.close}><X aria-hidden="true" /></button>
            <div className={`oracle-lotus ${generating ? "is-reading" : ""}`} aria-hidden="true">
              <Image src="/assets/logo.png" alt="" width={148} height={148} />
              <i /><i /><i /><i /><i />
            </div>
            <span className="eyebrow">Seren Lottery Chain</span>
            <h2 id="oracle-dialog-title">{generating ? content.generating : content.prediction}</h2>
            {!generating && selection && (
              <div className="oracle-card" aria-live="polite">
                <Image src="/assets/logo.png" alt="" width={48} height={48} />
                <blockquote>{message}</blockquote>
                <div><span>{content.luckyNumber}<strong>{selection.luckyNumber}</strong></span><span>{content.symbol}<strong>{symbol}</strong></span></div>
                <time dateTime={selection.dateKey}>{selection.dateKey}</time>
              </div>
            )}
            <p id="oracle-disclaimer" className="oracle-disclaimer">{content.disclaimer}</p>
            <div className="oracle-actions">
              <button type="button" className="button button--outline" onClick={close}>{content.close}</button>
              <button type="button" className="button button--primary" onClick={share} disabled={!selection || generating}>{shared ? <Copy aria-hidden="true" /> : <Share2 aria-hidden="true" />}{shared ? content.shared : content.share}</button>
              {!wallet.account && <button type="button" className="button button--glass" onClick={() => void generate()} disabled={generating}><RefreshCcw aria-hidden="true" />{content.newPrediction}</button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
