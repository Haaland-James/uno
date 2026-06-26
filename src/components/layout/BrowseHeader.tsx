"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Search, X, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/stores/authModalStore";
import { resolveTextToUrl } from "@/lib/search-url";

/**
 * The browse-style header used on guest-accessible browse surfaces:
 * `/search`, `/property/[id]`. Logo + central search + Join/Sign In CTA.
 *
 * For authenticated users we still show the Join/Sign In CTA hidden and
 * replace it with a small profile chip — but the search bar stays so the
 * search experience is consistent across roles.
 */
export function BrowseHeader({
  initialQuery = "",
  onSubmitSearch,
}: {
  initialQuery?: string;
  onSubmitSearch?: (q: string) => void;
}) {
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const openLogin = useAuthModalStore((s) => s.openLogin);

  const [searchText, setSearchText] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (onSubmitSearch) {
      onSubmitSearch(q);
    } else {
      router.push(resolveTextToUrl(q));
    }
  };

  return (
    <>
      {/* Desktop */}
      <header className="sticky top-0 z-50 hidden h-16 w-full flex-shrink-0 border-b border-[rgba(0,0,0,0.1)] bg-[#fbfbfb] md:block">
        <div className="flex h-full items-center justify-between px-[41px]">
          <div className="flex items-center gap-[50px]">
            <Link href="/" className="flex items-center gap-[6px]">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#f5d0d0]">
                <Home className="h-[18px] w-[18px] text-[#af2525]" strokeWidth={2.5} />
              </div>
              <span className="text-[28px] font-normal leading-none text-[#af2525]">uno</span>
            </Link>

            <form
              onSubmit={handleSubmit}
              className="flex h-[48px] w-[570px] items-center justify-between rounded-[40px] border border-[rgba(186,186,186,0.65)] px-[23px]"
            >
              <div className="flex flex-1 items-center gap-[6px]">
                <button
                  type="submit"
                  className={cn(
                    "flex h-[25px] w-[25px] flex-shrink-0 items-center justify-center rounded-full transition-colors",
                    searchText ? "bg-[#af2525]" : "bg-[rgba(175,37,37,0.3)]"
                  )}
                  aria-label="Search"
                >
                  <Search className="h-[14px] w-[14px] text-white" />
                </button>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="City, Address, Neighbourhood..."
                  className={cn(
                    "w-full bg-transparent text-[16px] outline-none placeholder:text-[rgba(10,10,10,0.4)]",
                    searchText ? "text-[#0a0a0a]" : "text-[rgba(10,10,10,0.4)]"
                  )}
                />
              </div>
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="flex-shrink-0 text-[rgba(0,0,0,0.35)] transition-colors hover:text-[rgba(0,0,0,0.7)]"
                  aria-label="Clear search"
                >
                  <X size={20} />
                </button>
              )}
            </form>
          </div>

          {isAuthed ? (
            <Link
              href="/feed"
              className="flex h-[41px] items-center justify-center rounded-full border border-[#af2525] px-[24px] text-[15px] font-medium text-[#af2525] transition-colors hover:bg-[#af2525] hover:text-white"
            >
              Go to Feed
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className="flex h-[41px] items-center justify-center rounded-full bg-[#af2525] px-[30px] text-[15px] font-normal tracking-[-0.3px] text-white transition-opacity hover:opacity-90"
            >
              Join / Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile */}
      <header className="sticky top-0 z-50 flex h-[64px] flex-shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.1)] bg-[#fbfbfb] px-[15px] md:hidden">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#f5d0d0]">
            <Home className="h-[14px] w-[14px] text-[#af2525]" strokeWidth={2.5} />
          </div>
          <span className="text-[22px] font-normal leading-none text-[#af2525]">uno</span>
        </Link>

        <form onSubmit={handleSubmit} className="flex flex-1 items-center px-3">
          <div className="flex h-[37px] w-full items-center rounded-[40px] border border-[rgba(186,186,186,0.65)] px-3">
            <button
              type="submit"
              className={cn(
                "mr-2 flex h-[21px] w-[21px] flex-shrink-0 items-center justify-center rounded-full transition-colors",
                searchText ? "bg-[#af2525]" : "bg-[rgba(175,37,37,0.3)]"
              )}
              aria-label="Search"
            >
              <Search className="h-[10px] w-[10px] text-white" />
            </button>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[rgba(10,10,10,0.4)]"
            />
          </div>
        </form>

        {isAuthed ? (
          <Link href="/feed" className="text-[14px] font-medium text-[#af2525]">
            Feed
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openLogin()}
            className="text-[14px] font-normal tracking-[-0.28px] text-black/60"
          >
            Sign In
          </button>
        )}
      </header>
    </>
  );
}
