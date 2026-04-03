"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PricingDropDownProps {
  minPrice?: number;
  maxPrice?: number;
  onApply?: (min: number, max: number) => void;
  className?: string;
}

const ABSOLUTE_MIN = 0;
const ABSOLUTE_MAX = 100000000;

function formatNaira(value: number): string {
  if (value >= ABSOLUTE_MAX) return "₦100,00,000 +";
  return "₦" + value.toLocaleString("en-NG");
}

function parseNaira(raw: string): number {
  const cleaned = raw.replace(/[₦,\s]/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function PricingDropDown({
  minPrice = 0,
  maxPrice = ABSOLUTE_MAX,
  onApply,
  className,
}: PricingDropDownProps) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const [minInput, setMinInput] = useState(
    minPrice === 0 ? "" : minPrice.toLocaleString("en-NG")
  );
  const [maxInput, setMaxInput] = useState(
    maxPrice >= ABSOLUTE_MAX ? "" : maxPrice.toLocaleString("en-NG")
  );

  const minPercent = ((localMin - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100;
  const maxPercent = ((localMax - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100;

  const handleMinSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - 1);
    setLocalMin(val);
    setMinInput(val === 0 ? "" : val.toLocaleString("en-NG"));
  };

  const handleMaxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + 1);
    setLocalMax(val);
    setMaxInput(val >= ABSOLUTE_MAX ? "" : val.toLocaleString("en-NG"));
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInput(e.target.value);
  };

  const handleMinInputBlur = () => {
    const parsed = parseNaira(minInput);
    const clamped = Math.max(ABSOLUTE_MIN, Math.min(parsed, localMax - 1));
    setLocalMin(clamped);
    setMinInput(clamped === 0 ? "" : clamped.toLocaleString("en-NG"));
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxInput(e.target.value);
  };

  const handleMaxInputBlur = () => {
    const parsed = parseNaira(maxInput);
    const clamped = Math.min(ABSOLUTE_MAX, Math.max(parsed, localMin + 1));
    setLocalMax(clamped);
    setMaxInput(clamped >= ABSOLUTE_MAX ? "" : clamped.toLocaleString("en-NG"));
  };

  const handleApply = () => {
    onApply?.(localMin, localMax);
  };

  return (
    <div
      className={cn(
        "w-[410px] rounded-[20px] bg-[#fbfbfb]",
        "shadow-[0px_4px_24px_0px_rgba(0,0,0,0.15)]",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="bg-white h-[59px] px-[25px] flex items-center rounded-t-[20px]">
        <span className="text-[20px] font-medium text-[#161515] font-sans">
          Pricing
        </span>
      </div>

      {/* Body */}
      <div className="px-[25px] py-[20px] flex flex-col gap-[20px]">
        {/* Price range labels */}
        <div className="flex items-center justify-between">
          <span className="text-[18px] font-medium text-[#0a0a0a] font-sans">
            {formatNaira(localMin)}
          </span>
          <span className="text-[18px] font-medium text-[#0a0a0a] font-sans">
            {localMax >= ABSOLUTE_MAX ? "₦100,00,000 +" : formatNaira(localMax)}
          </span>
        </div>

        {/* Range slider */}
        <div className="relative h-[6px] flex items-center">
          {/* Track background */}
          <div className="absolute w-full h-[4px] rounded-full bg-[rgba(0,0,0,0.1)]" />
          {/* Active track */}
          <div
            className="absolute h-[4px] rounded-full bg-[#af2525]"
            style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
          />
          {/* Min thumb */}
          <input
            type="range"
            min={ABSOLUTE_MIN}
            max={ABSOLUTE_MAX}
            step={500000}
            value={localMin}
            onChange={handleMinSlider}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#af2525] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
          />
          {/* Max thumb */}
          <input
            type="range"
            min={ABSOLUTE_MIN}
            max={ABSOLUTE_MAX}
            step={500000}
            value={localMax}
            onChange={handleMaxSlider}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#af2525] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
          />
        </div>

        {/* Min / Max inputs */}
        <div className="flex items-center gap-[14px]">
          {/* Min */}
          <div className="flex flex-col gap-[6px]">
            <span className="text-[12px] text-[rgba(10,10,10,0.5)] font-sans">
              Min price
            </span>
            <div className="relative w-[180px]">
              <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[14px] text-[rgba(10,10,10,0.5)] font-sans pointer-events-none">
                ₦
              </span>
              <input
                type="text"
                value={minInput}
                onChange={handleMinInputChange}
                onBlur={handleMinInputBlur}
                placeholder="0"
                className={cn(
                  "w-full h-[48px] pl-[26px] pr-[14px] rounded-[40px]",
                  "border border-[rgba(186,186,186,0.65)]",
                  "text-[14px] text-[rgba(10,10,10,0.8)] font-normal font-sans",
                  "placeholder:text-[rgba(10,10,10,0.4)]",
                  "focus:border-[#af2525] focus:outline-none bg-transparent transition-colors"
                )}
              />
            </div>
          </div>

          {/* Max */}
          <div className="flex flex-col gap-[6px]">
            <span className="text-[12px] text-[rgba(10,10,10,0.5)] font-sans">
              Max price
            </span>
            <div className="relative w-[180px]">
              <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[14px] text-[rgba(10,10,10,0.5)] font-sans pointer-events-none">
                ₦
              </span>
              <input
                type="text"
                value={maxInput}
                onChange={handleMaxInputChange}
                onBlur={handleMaxInputBlur}
                placeholder="100,00,000"
                className={cn(
                  "w-full h-[48px] pl-[26px] pr-[14px] rounded-[40px]",
                  "border border-[rgba(186,186,186,0.65)]",
                  "text-[14px] text-[rgba(10,10,10,0.8)] font-normal font-sans",
                  "placeholder:text-[rgba(10,10,10,0.4)]",
                  "focus:border-[#af2525] focus:outline-none bg-transparent transition-colors"
                )}
              />
            </div>
          </div>
        </div>

        {/* Apply button */}
        <button
          type="button"
          onClick={handleApply}
          className={cn(
            "w-full h-[41px] rounded-[50px] bg-[#af2525]",
            "text-white text-[15px] font-normal font-sans",
            "hover:bg-[#9a2020] active:bg-[#861c1c] transition-colors"
          )}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
