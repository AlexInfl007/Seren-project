export default function SectionHeading({ eyebrow, title, body, align = "left" }: { eyebrow: string; title: string; body?: string; align?: "left" | "center" }) {
  return <div className={`section-heading section-heading--${align}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{body && <p>{body}</p>}</div>;
}
