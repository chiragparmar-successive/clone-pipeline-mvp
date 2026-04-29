import type { ContentBlockSection } from "@/types/cms";

export default function ContentBlock({ data }: { data: ContentBlockSection }) {
  const align = data.alignment ?? "left";
  const alignClass =
    align === "center"
      ? "text-center mx-auto"
      : align === "right"
        ? "text-right ml-auto"
        : "text-left";
  return (
    <section className="border-t border-stone-100 bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className={`max-w-3xl ${alignClass}`}>
          {data.heading ? (
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              {data.heading}
            </h2>
          ) : null}
          {data.body ? (
            <p className="text-lg leading-relaxed text-stone-700">
              {data.body}
            </p>
          ) : null}
          {data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.imageUrl}
              alt={data.heading ?? ""}
              className="mt-8 w-full rounded-2xl"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
