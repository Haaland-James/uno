import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/../config/site";
import { COMPACT_LEGAL_LINKS } from "@/lib/nav-links";

/**
 * Compact footer for the in-column position on the search page.
 * The full marketing Footer is too wide for the ~520px left column.
 */
export function SearchPageFooter() {
  return (
    <footer className="w-full border-t border-black/8 bg-[#faf9f9] px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center">
          <Logo className="h-6 w-auto" />
        </Link>
        <span className="text-[12px] text-black/40">
          © {new Date().getFullYear()} {siteConfig.name} Nigeria
        </span>
      </div>
      <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {COMPACT_LEGAL_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[12px] text-black/55 transition-colors hover:text-[#af2525]"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
