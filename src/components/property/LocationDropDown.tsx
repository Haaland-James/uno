"use client";

import { useState } from "react";
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
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? locations.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.lga.toLowerCase().includes(query.toLowerCase())
      )
    : locations;

  const handleCustomSelect = () => {
    if (!query.trim()) return;
    onSelect?.({ id: "custom", name: query.trim(), lga: "" });
    setQuery("");
  };

  return (
    <div
      className={cn(
        "w-[410px] rounded-[20px] bg-[#fbfbfb]",
        "shadow-[0px_4px_17px_0px_rgba(0,0,0,0.15),0px_4px_4px_0px_rgba(0,0,0,0.25)]",
        "overflow-hidden",
        className
      )}
    >
      {/* Header — interactive text input */}
      <div className="bg-white border-b border-[rgba(186,186,186,0.4)] h-[78px] px-[19px] flex items-center rounded-t-[20px]">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCustomSelect();
          }}
          placeholder="tell us location you have in mind"
          className="w-full bg-transparent text-[18px] text-[rgba(10,10,10,0.78)] font-normal outline-none placeholder:text-[rgba(10,10,10,0.4)]"
        />
      </div>

      {/* Body */}
      <div className="px-[19px] py-[18px] flex flex-col gap-[4px]">
        <p className="text-[14px] text-[rgba(10,10,10,0.78)] font-normal mb-[10px]">
          {query.trim() ? "Results" : "Popular Locations"}
        </p>

        <ul className="flex flex-col gap-[4px]">
          {filtered.map((location) => (
            <li key={location.id}>
              <button
                type="button"
                onClick={() => onSelect?.(location)}
                className={cn(
                  "w-full flex items-center gap-[14px] px-[8px] py-[10px] rounded-[12px]",
                  "hover:bg-[rgba(175,37,37,0.05)] transition-colors text-left"
                )}
              >
                <div className="flex-shrink-0 w-[45px] h-[45px] rounded-full bg-[#ffcfcf] flex items-center justify-center">
                  <MapPin size={20} color="#af2525" strokeWidth={1.8} />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[16px] text-[#0a0a0a] font-normal leading-tight">
                    {location.name}
                  </span>
                  {location.lga && (
                    <span className="text-[12px] text-[rgba(10,10,10,0.78)] font-normal leading-tight">
                      {location.lga}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}

          {/* No results — allow submitting custom */}
          {filtered.length === 0 && query.trim() && (
            <li>
              <button
                type="button"
                onClick={handleCustomSelect}
                className={cn(
                  "w-full flex items-center gap-[14px] px-[8px] py-[10px] rounded-[12px]",
                  "hover:bg-[rgba(175,37,37,0.05)] transition-colors text-left"
                )}
              >
                <div className="flex-shrink-0 w-[45px] h-[45px] rounded-full bg-[#ffcfcf] flex items-center justify-center">
                  <MapPin size={20} color="#af2525" strokeWidth={1.8} />
                </div>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[16px] text-[#0a0a0a] font-normal leading-tight">
                    {query.trim()}
                  </span>
                  <span className="text-[12px] text-[rgba(10,10,10,0.78)] font-normal leading-tight">
                    Use this location
                  </span>
                </div>
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
