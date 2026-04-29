import type { Page } from "@/types/cms";

const BASE_URL = (
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
).replace(/\/$/, "");

const POPULATE = "populate[sections][populate]=*&populate[seo]=true";

async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type Envelope<T> = { data: T | null };

export async function listPages(): Promise<Page[]> {
  const url = `${BASE_URL}/api/pages?${POPULATE}`;
  const json = await safeJson<Envelope<Page[]>>(url);
  if (!json || !Array.isArray(json.data)) return [];
  return json.data;
}

export async function getPage(slug: string): Promise<Page | null> {
  const url = `${BASE_URL}/api/pages?filters[slug][$eq]=${encodeURIComponent(
    slug,
  )}&${POPULATE}`;
  const json = await safeJson<Envelope<Page[]>>(url);
  if (!json || !Array.isArray(json.data) || json.data.length === 0) return null;
  return json.data[0];
}

export const STRAPI_BASE_URL = BASE_URL;
