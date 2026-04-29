export default function Footer() {
  return (
    <footer className="mt-24 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-stone-600">
          © {new Date().getFullYear()} TabiPass — Private booking portal.
        </p>
        <div className="flex flex-wrap gap-6 text-sm text-stone-600">
          <a href="/privacy-policy" className="hover:text-teal-700">
            Privacy Policy
          </a>
          <a href="/contact" className="hover:text-teal-700">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
