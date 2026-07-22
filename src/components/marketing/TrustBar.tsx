import { BadgeCheck, Coins, Dices, ShieldCheck, Trophy, WalletCards } from "lucide-react";
import Container from "@/components/layout/Container";
import type { SiteContent } from "@/i18n/siteContent";

const icons = [Coins, BadgeCheck, Dices, Trophy, ShieldCheck, WalletCards];

export default function TrustBar({ content }: { content: SiteContent }) {
  return <div className="trust-bar"><Container>{content.trust.map((label, index) => { const Icon = icons[index]; return <div key={label}><Icon aria-hidden="true" /><span>{label}</span></div>; })}</Container></div>;
}
