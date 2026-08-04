import Link from "next/link";
import { Search, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-surface px-4 py-24 text-center">
      <span className="rounded-2xl bg-navy-900 px-6 py-3 font-display text-4xl font-extrabold text-safety-400">
        404
      </span>
      <h1 className="font-display text-3xl font-extrabold text-navy-900">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-500">
        The page you&apos;re looking for may have moved or no longer exists. Let&apos;s get you back to safety.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-7 py-3.5 text-sm font-bold text-white hover:bg-safety-600"
        >
          <Home className="h-4 w-4" /> Back to Home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-7 py-3.5 text-sm font-bold text-navy-900 hover:bg-surface"
        >
          <Search className="h-4 w-4" /> Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
