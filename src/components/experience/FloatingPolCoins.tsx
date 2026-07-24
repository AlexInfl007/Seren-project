"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const coins = [
  [7, 16, .18, 56], [18, 44, -.11, 42], [29, 76, .14, 66], [40, 25, -.17, 48],
  [51, 61, .09, 54], [61, 12, -.13, 38], [70, 84, .16, 62], [79, 37, -.08, 45],
  [87, 68, .12, 52], [94, 20, -.15, 40], [34, 92, .1, 44], [12, 88, -.09, 50],
] as const;

type CoinStyle = CSSProperties & { "--coin-x": string; "--coin-y": string; "--coin-size": string; "--coin-index": number };

export default function FloatingPolCoins() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      root.dataset.motion = "reduced";
      return;
    }

    let scrollY = window.scrollY;
    let velocity = 0;
    let previousScroll = scrollY;
    let frame = 0;
    const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 4;
    const elements = [...root.querySelectorAll<HTMLElement>(".pol-coin")].slice(0, lowEnd ? 6 : coins.length);
    root.dataset.motion = "active";
    if (lowEnd) root.dataset.device = "low-end";

    const onScroll = () => {
      scrollY = window.scrollY;
      velocity += Math.max(-18, Math.min(18, scrollY - previousScroll)) * .08;
      previousScroll = scrollY;
    };
    const animate = (time: number) => {
      velocity *= .91;
      elements.forEach((element, index) => {
        const direction = index % 2 ? -1 : 1;
        const drift = Math.sin(time * .00025 + index) * 12;
        const y = scrollY * coins[index][2] + drift + velocity * direction;
        const rotate = time * .006 * direction + scrollY * .018;
        element.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg)`;
      });
      frame = window.requestAnimationFrame(animate);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame = window.requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className="floating-pol-coins" aria-hidden="true">
      {coins.map(([x, y, , size], index) => <span className="pol-coin" key={`${x}-${y}`} style={{ "--coin-x": `${x}vw`, "--coin-y": `${y}%`, "--coin-size": `${size}px`, "--coin-index": index } as CoinStyle} />)}
    </div>
  );
}
