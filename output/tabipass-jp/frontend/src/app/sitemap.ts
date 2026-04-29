import type { MetadataRoute } from "next";
import { listPages } from "@/lib/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const pages = await listPages();
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date() },
  ];
  for (const p of pages) {
    if (!p.slug || p.slug === "home") continue;
    entries.push({ url: `${base}/${p.slug}`, lastModified: new Date() });
  }
  return entries;
}
