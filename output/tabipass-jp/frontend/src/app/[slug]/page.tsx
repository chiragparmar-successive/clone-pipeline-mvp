import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, listPages } from "@/lib/cms";
import SectionRenderer from "@/components/sections/SectionRenderer";

export async function generateStaticParams() {
  const pages = await listPages();
  return pages
    .filter((p) => p.slug && p.slug !== "home")
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.seo?.metaTitle ?? page.title,
    description: page.seo?.metaDescription ?? undefined,
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <article>
      <header className="mx-auto max-w-4xl px-6 pt-20 pb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
          {page.title}
        </h1>
      </header>
      <SectionRenderer sections={page.sections} />
    </article>
  );
}
