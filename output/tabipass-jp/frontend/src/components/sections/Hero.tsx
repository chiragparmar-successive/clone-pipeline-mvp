import type { HeroSection } from "@/types/cms";

export default function Hero({ data }: { data: HeroSection }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-white to-teal-50">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
        <div className="space-y-6">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            {data.headline}
          </h1>
          {data.subheadline ? (
            <p className="max-w-xl text-lg leading-relaxed text-stone-600">
              {data.subheadline}
            </p>
          ) : null}
          {data.ctaText && data.ctaHref ? (
            <a
              href={data.ctaHref}
              className="inline-flex items-center rounded-full bg-teal-700 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-teal-800"
            >
              {data.ctaText}
            </a>
          ) : null}
        </div>
        {data.imageUrl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-stone-200">
            {/* Use plain <img> to avoid next/image remote pattern config for arbitrary CMS hosts. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.imageUrl}
              alt={data.headline}
              className="h-full w-full object-contain p-12"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
