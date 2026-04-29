import type { Metadata } from "next";
import { getPage } from "@/lib/cms";
import SectionRenderer from "@/components/sections/SectionRenderer";
import Fallback from "@/components/sections/Fallback";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("home");
  if (!page) return {};
  return {
    title: page.seo?.metaTitle ?? page.title,
    description: page.seo?.metaDescription ?? undefined,
  };
}

export default async function HomePage() {
  const page = await getPage("home");
  if (!page) return <Fallback title="TabiPass" />;
  return <SectionRenderer sections={page.sections} />;
}
