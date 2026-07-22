import type { MetadataRoute } from "next";
import { getCanonicalOrigin, isProductionSeo } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSeo()) return { rules: { userAgent: "*", disallow: "/" } };
  const base = getCanonicalOrigin();
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${base}/sitemap.xml`, host: base };
}
