import Link from "next/link";

const NAV = [
  { href: "/", label: "About TabiPass" },
  { href: "/hotels", label: "Hotel List" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight text-stone-900">
            Tabi<span className="text-teal-700">Pass</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone-700 transition hover:text-teal-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <select
            aria-label="Select language"
            className="hidden rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-700 md:block"
            defaultValue="en"
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
          <a
            href="https://en.tabipass.jp/hotels/"
            className="inline-flex items-center rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Member Login
          </a>
        </div>
      </div>
    </header>
  );
}
