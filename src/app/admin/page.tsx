import type { Metadata } from "next";
import AdminApp from "@/components/AdminApp";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() { return <AdminApp/>; }
