"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedSearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageItems(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "...")[] = [];
  const showLeftEllipsis = current > 4;
  const showRightEllipsis = current < total - 3;

  items.push(1);
  if (showLeftEllipsis) items.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) items.push(i);

  if (showRightEllipsis) items.push("...");
  items.push(total);
  return items;
}

export function SavedSearchPagination({
  currentPage,
  totalPages,
  onPageChange,
}: SavedSearchPaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages;
  const items = getPageItems(currentPage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Saved searches pagination"
      className="flex items-center justify-center gap-2 md:gap-3 py-4"
    >
      <button
        type="button"
        onClick={() => !prevDisabled && onPageChange(currentPage - 1)}
        disabled={prevDisabled}
        className={cn(
          "inline-flex items-center gap-1.5 text-[14px] text-[#161515]",
          prevDisabled && "opacity-40 cursor-not-allowed"
        )}
        aria-label="Previous page"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#fff1f1] text-[#af2525]">
          <ChevronLeft size={14} />
        </span>
        <span className="hidden sm:inline">Previous</span>
      </button>

      <ul className="hidden sm:flex items-center gap-1">
        {items.map((item, idx) =>
          item === "..." ? (
            <li
              key={`ellipsis-${idx}`}
              className="px-2 text-[14px] text-[rgba(10,10,10,0.5)]"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={cn(
                  "min-w-[28px] h-7 px-2 text-[14px] rounded-full transition-colors",
                  item === currentPage
                    ? "bg-[#af2525] text-white"
                    : "text-[#161515] hover:bg-[#f5f5f5]"
                )}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <span className="sm:hidden text-[13px] text-[rgba(10,10,10,0.78)]">
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => !nextDisabled && onPageChange(currentPage + 1)}
        disabled={nextDisabled}
        className={cn(
          "inline-flex items-center gap-1.5 text-[14px] text-[#161515]",
          nextDisabled && "opacity-40 cursor-not-allowed"
        )}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#af2525] text-white">
          <ChevronRight size={14} />
        </span>
      </button>
    </nav>
  );
}

export default SavedSearchPagination;
