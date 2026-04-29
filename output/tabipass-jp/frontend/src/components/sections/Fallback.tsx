export default function Fallback({ title }: { title?: string }) {
  return (
    <section className="bg-gradient-to-br from-stone-50 via-white to-teal-50">
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
          {title ?? "TabiPass"}
        </h1>
        <p className="mt-6 text-lg text-stone-600">
          Content is currently unavailable. Please try again shortly.
        </p>
      </div>
    </section>
  );
}
