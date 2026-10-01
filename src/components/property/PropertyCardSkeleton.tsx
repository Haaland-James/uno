import { cn } from "@/lib/utils";

/**
 * Visual placeholder matching PropertyCard's dimensions exactly.
 * Used while a carousel or list is loading from the API.
 *
 * Keep the slot heights in step with PropertyCard: price row min-h 52/58, one
 * amenities line 15/18, the 20px badge slot, then the button.
 */
export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col bg-white border border-[rgba(0,0,0,0.06)] rounded-[15px] pb-[10px]",
        "w-[234px] md:w-[325px]",
        className
      )}
    >
      <div className="h-[160px] md:h-[216px] rounded-t-[15px] bg-[rgba(0,0,0,0.06)] animate-pulse" />
      <div className="flex flex-col gap-[10px] px-[6px] pt-[10px]">
        <div className="flex flex-col gap-[15px]">
          <div className="flex items-end justify-between min-h-[52px] md:min-h-[58px]">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="h-5 w-24 rounded bg-[rgba(0,0,0,0.06)] animate-pulse" />
              <div className="h-3 w-32 rounded bg-[rgba(0,0,0,0.06)] animate-pulse" />
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <div className="h-[24px] md:h-[27px] w-[72px] md:w-[84px] rounded-[14px] bg-[rgba(0,0,0,0.06)] animate-pulse" />
              <div className="h-[24px] md:h-[27px] w-[72px] md:w-[84px] rounded-[14px] bg-[rgba(0,0,0,0.06)] animate-pulse" />
            </div>
          </div>
          <div className="h-[15px] md:h-[18px] w-3/4 rounded bg-[rgba(0,0,0,0.06)] animate-pulse" />
        </div>
        <div className="h-[20px]" />
        <div className="h-[30px] md:h-[41px] rounded-[50px] bg-[rgba(175,37,37,0.15)] animate-pulse" />
      </div>
    </div>
  );
}
