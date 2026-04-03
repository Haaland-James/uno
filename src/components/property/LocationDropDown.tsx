"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  lga: string;
}

interface LocationDropDownProps {
  locations?: Location[];
  onSelect?: (location: Location) => void;
  className?: string;
}

const DEFAULT_LOCATIONS: Location[] = [
  { id: "1", name: "Ewet Housing Estate", lga: "Uyo Municipal" },
  { id: "2", name: "Use-Offot", lga: "Uruan" },
  { id: "3", name: "Shelter Afrique", lga: "Uyo Municipal" },
  { id: "4", name: "Ring Road", lga: "Uyo Municipal" },
  { id: "5", name: "Itam", lga: "Itu" },
];

export function LocationDropDown({
  locations = DEFAULT_LOCATIONS,
  onSelect,
  className,
}: LocationDropDownProps) {
  return (
    <div
      className={cn(
        "w-[410px] rounded-[20px] bg-[#fbfbfb]",
        "shadow-[0px_4px_17px_0px_rgba(0,0,0,0.15),0px_4px_4px_0px_rgba(0,0,0,0.25)]",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "bg-white border-b border-[rgba(186,186,186,0.4)]",
          "h-[78px] px-[19px] flex items-center rounded-t-[20px]"
        )}
      >
        <p className="text-[18px] text-[rgba(10,10,10,0.78)] font-normal font-sans leading-snug">
          tell us location you have in mind
        </p>
      </div>

      {/* Body */}
      <div className="px-[19px] py-[18px] flex flex-col gap-[4px]">
        {/* Section title */}
        <p className="text-[14px] text-[rgba(10,10,10,0.78)] font-normal font-sans mb-[10px]">
          Popular Locations
        </p>

        {/* Location items */}
        <ul className="flex flex-col gap-[4px]">
          {locations.map((location) => (
            <li key={location.id}>
              <button
                type="button"
                onClick={() => onSelect?.(location)}
                className={cn(
                  "w-full flex items-center gap-[14px] px-[8px] py-[10px] rounded-[12px]",
                  "hover:bg-[rgba(175,37,37,0.05)] transition-colors text-left"
                )}
              >
                {/* Icon circle */}
                <div className="flex-shrink-0 w-[45px] h-[45px] rounded-full bg-[#ffcfcf] flex items-center justify-center">
                  <MapPin size={20} color="#af2525" strokeWidth={1.8} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[16px] text-[#0a0a0a] font-normal font-sans leading-tight">
                    {location.name}
                  </span>
                  <span className="text-[12px] text-[rgba(10,10,10,0.78)] font-normal font-sans leading-tight">
                    {location.lga}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
