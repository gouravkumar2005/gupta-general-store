import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Gupta General &amp; Confectionary Store. Order on WhatsApp too!</p>
        <Link href="/admin" className="hover:text-gray-700">
          Store Admin
        </Link>
      </div>
    </footer>
  );
}
