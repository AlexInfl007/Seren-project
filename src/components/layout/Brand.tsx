import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";

export default function Brand({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <Link href={`/${locale}#home`} className={`site-brand ${compact ? "site-brand--compact" : ""}`} aria-label="Seren Lottery Chain">
      <Image src="/assets/logo.png" alt="" width={54} height={54} sizes="54px" />
      <span><strong>Seren</strong><em>Lottery Chain</em></span>
    </Link>
  );
}
