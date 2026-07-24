import { BadgeCheck, Coins, Dices, ShieldCheck, Trophy, WalletCards } from "lucide-react";
import Container from "@/components/layout/Container";
import { CONTRACT_LINK, POLYGON_EXPLORER, VRF_COORDINATOR_LINK } from "@/config/contract";
import type { SiteContent } from "@/i18n/siteContent";

const icons = [Coins, Dices, BadgeCheck, Trophy, WalletCards, ShieldCheck];
const hrefs = [POLYGON_EXPLORER, VRF_COORDINATOR_LINK, CONTRACT_LINK, "#winners", "#account", "#security"];

export default function TrustBar({ content }: { content: SiteContent }) {
  return <nav className="trust-bar" aria-label={content.nav.transparency}><Container>{content.trust.map((label, index) => { const Icon = icons[index]; const external = hrefs[index].startsWith("http"); return <a key={label} href={hrefs[index]} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}><Icon aria-hidden="true" /><span>{label}</span></a>; })}</Container></nav>;
}
