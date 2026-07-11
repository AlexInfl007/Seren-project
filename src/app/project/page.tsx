import type { Metadata } from "next";
import ProjectPageContent from "@/components/ProjectPageContent";

export const metadata: Metadata = {
  title: "About the transparent on-chain lottery",
  description: "How Seren Lottery Chain works: Polygon smart contract, verifiable activity, Chainlink VRF randomness, prize mechanics and participation risks.",
  alternates: { canonical: "/project" },
  openGraph: {
    title: "How Seren Lottery Chain works",
    description: "Explore the transparent rules, verifiable smart contract and risks of the Polygon on-chain lottery.",
    url: "/project",
    type: "article",
  },
};

export default function ProjectPage() {
  return <ProjectPageContent />;
}
