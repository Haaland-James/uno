"use client";

import { cn } from "@/lib/utils";

interface PropertyTypesDropDownProps {
  selected?: string[];
  onChange?: (types: string[]) => void;
  className?: string;
}

const PROPERTY_TYPES = [
  "Any",
  "Studio Apartment",
  "Detached",
  "Semi-Detached",
  "Apartment",
  "Loft",
  "Condominium",
  "Bungalow",
  "Duplex",
  "Triplex",
  "Penthouse",
  "Cottage",
  "Villa",
  "Mansion",
  "Mobile Home",
  "Row House",
];

export function PropertyTypesDropDown({
  selected = [],
  onChange,
  className,
}: PropertyTypesDropDownProps) {
  const handleToggle = (type: string) => {
    if (type === "Any") {
      onChange?.(selected.includes("Any") ? [] : ["Any"]);
      return;
    }

    let next: string[];
    if (selected.includes(type)) {
      next = selected.filter((t) => t !== type);
    } else {
      next = [...selected.filter((t) => t !== "Any"), type];
    }
    onChange?.(next);
  };

  return (
    <div
      className={cn(
        "w-[265px] rounded-[20px] bg-[#fbfbfb] px-[30px] py-[21px]",
        "shadow-[0px_4px_15px_0px_rgba(0,0,0,0.19)]",
        className
      )}
    >
      {/* Section title */}
      <p className="text-[14px] text-[rgba(10,10,10,0.78)] font-normal font-sans mb-[14px]">
        Property Type
      </p>

      {/* Options list */}
      <ul className="flex flex-col gap-[5px]">
        {PROPERTY_TYPES.map((type) => {
          const isChecked = selected.includes(type);
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => handleToggle(type)}
                className="flex items-center gap-[10px] w-full py-[4px] text-left group"
              >
                {/* Checkbox */}
                <span
                  className={cn(
                    "flex-shrink-0 w-[15px] h-[15px] rounded-[3px] border transition-colors",
                    isChecked
                      ? "bg-[#af2525] border-[#af2525]"
                      : "bg-white border-[rgba(0,0,0,0.23)]"
                  )}
                >
                  {isChecked && (
                    <svg
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full"
                    >
                      <path
                        d="M3 7.5L6 10.5L12 4.5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "text-[14px] font-normal font-sans transition-colors",
                    isChecked
                      ? "text-[#0a0a0a]"
                      : "text-[rgba(10,10,10,0.78)]"
                  )}
                >
                  {type}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
