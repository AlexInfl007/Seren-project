import type { ReactNode } from "react";
import Container from "@/components/layout/Container";

export default function Section({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return <section id={id} className={`site-section ${className}`.trim()}><Container>{children}</Container></section>;
}
