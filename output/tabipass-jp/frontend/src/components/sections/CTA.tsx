import type { CtaSection } from "@/types/cms";

export default function CTA({ data }: { data: CtaSection }) {
  return (
    <section className="bg-teal-800">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {data.heading}
        </h2>
        {data.body ? (
          <p className="max-w-2xl text-lg leading-relaxed text-teal-50/90">
            {data.body}
          </p>
        ) : null}
        {data.buttonText && data.buttonHref ? (
          <a
            href={data.buttonHref}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-base font-semibold text-teal-800 shadow-md transition hover:bg-stone-100"
          >
            {data.buttonText}
          </a>
        ) : null}
      </div>
    </section>
  );
}
