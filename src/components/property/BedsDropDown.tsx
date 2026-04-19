"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BedsDropDownProps {
  beds?: number;
  baths?: number;
  onApply?: (beds: number, baths: number) => void;
  className?: string;
}

export function BedsDropDown({
  beds: initialBeds = 0,
  baths: initialBaths = 0,
  onApply,
  className,
}: BedsDropDownProps) {
  const [beds, setBeds] = useState(initialBeds);
  const [baths, setBaths] = useState(initialBaths);

  return (
    <div
      className={cn(
        "w-full max-w-[336px] rounded-[20px] bg-[#fbfbfb] px-[18px] py-[19px]",
        "shadow-[0px_4px_24px_0px_rgba(0,0,0,0.15)]",
        className
      )}
    >
      <div className="flex flex-col gap-[19px]">
        {/* Beds row */}
        <div className="flex flex-col gap-[8px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
          <div className="flex items-center justify-between">
            <span className="text-[17px] text-[rgba(10,10,10,0.78)] font-normal">
              No. of Bed
            </span>
            <div className="flex items-center gap-[18px]">
              <button
                type="button"
                onClick={() => setBeds((b) => Math.max(0, b - 1))}
                className="w-[22px] h-[22px] flex items-center justify-center rounded-full border border-[rgba(0,0,0,0.3)] text-[rgba(10,10,10,0.6)] hover:border-[#af2525] hover:text-[#af2525] transition-colors"
                aria-label="Decrease beds"
              >
                <Minus size={12} strokeWidth={2} />
              </button>
              <span className="text-[25px] font-medium text-black w-[20px] text-center tabular-nums">
                {beds}
              </span>
              <button
                type="button"
                onClick={() => setBeds((b) => b + 1)}
                className="w-[22px] h-[22px] flex items-center justify-center rounded-full border border-[rgba(0,0,0,0.3)] text-[rgba(10,10,10,0.6)] hover:border-[#af2525] hover:text-[#af2525] transition-colors"
                aria-label="Increase beds"
              >
                <Plus size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Baths row */}
        <div className="flex flex-col gap-[8px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
          <div className="flex items-center justify-between">
            <span className="text-[17px] text-[rgba(10,10,10,0.78)] font-normal">
              No. of Bath
            </span>
            <div className="flex items-center gap-[18px]">
              <button
                type="button"
                onClick={() => setBaths((b) => Math.max(0, b - 1))}
                className="w-[22px] h-[22px] flex items-center justify-center rounded-full border border-[rgba(0,0,0,0.3)] text-[rgba(10,10,10,0.6)] hover:border-[#af2525] hover:text-[#af2525] transition-colors"
                aria-label="Decrease baths"
              >
                <Minus size={12} strokeWidth={2} />
              </button>
              <span className="text-[25px] font-medium text-black w-[20px] text-center tabular-nums">
                {baths}
              </span>
              <button
                type="button"
                onClick={() => setBaths((b) => b + 1)}
                className="w-[22px] h-[22px] flex items-center justify-center rounded-full border border-[rgba(0,0,0,0.3)] text-[rgba(10,10,10,0.6)] hover:border-[#af2525] hover:text-[#af2525] transition-colors"
                aria-label="Increase baths"
              >
                <Plus size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Apply */}
        <button
          type="button"
          onClick={() => onApply?.(beds, baths)}
          className="w-full h-[41px] rounded-full bg-[#af2525] text-white text-[15px] font-normal hover:bg-[#9a2020] active:bg-[#861c1c] transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
