import SerenApp from "@/components/SerenApp";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Seren Lottery Chain",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: "Transparent on-chain lottery on Polygon with verifiable smart-contract activity and Chainlink VRF randomness.",
    offers: { "@type": "Offer", priceCurrency: "POL", price: "30" },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><SerenApp /></>;
}
