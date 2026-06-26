"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { findBySlug } from "@/lib/coverage";
import { buildSearchUrl } from "@/lib/search-url";
import type { LocationNode } from "@/lib/coverage";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Buy",        category: "sale"  as const },
  { label: "Rent",       category: "rent"  as const },
  { label: "Lease",      category: "lease" as const },
  { label: "Commercial", category: "rent"  as const, typeFilter: ["COMMERCIAL", "OFFICE", "WAREHOUSE"] },
] as const;

type TabValue = typeof TABS[number]["label"];

export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("Rent");
  const [selectedLocation, setSelectedLocation] = useState<LocationNode | null>(null);

  const tab = TABS.find((t) => t.label === activeTab) ?? TABS[1];

  function handleSearch() {
    let stateNode: LocationNode | undefined;
    let cityNode:  LocationNode | undefined;
    let areaNode:  LocationNode | undefined;

    if (selectedLocation) {
      if (selectedLocation.type === "state") {
        stateNode = selectedLocation;
      } else if (selectedLocation.type === "city") {
        cityNode = selectedLocation;
        if (selectedLocation.parent) stateNode = findBySlug(selectedLocation.parent);
      } else if (selectedLocation.type === "area") {
        areaNode = selectedLocation;
        if (selectedLocation.parent) cityNode = findBySlug(selectedLocation.parent);
        if (cityNode?.parent) stateNode = findBySlug(cityNode.parent);
      }
    }

    const url = buildSearchUrl({
      category: tab.category,
      state: stateNode,
      city: cityNode,
      area: areaNode,
      beds: [],
      baths: [],
      type: "typeFilter" in tab ? [...tab.typeFilter] : [],
      furnishing: [],
      amenities: [],
      verifiedOnly: false,
      availableNow: false,
      page: 1,
    });
    router.push(url);
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Category tabs */}
      <div className="flex gap-[2px]">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setActiveTab(t.label)}
            className={cn(
              "px-[18px] md:px-[24px] py-[9px] md:py-[11px] text-[13px] md:text-[14px] font-medium rounded-t-[12px] transition-all",
              activeTab === t.label
                ? "bg-white text-[#161515] shadow-sm"
                : "bg-[#dbd8d8] text-[#000] hover:bg-[#ccc] hover:text-[#000]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-[12px] rounded-b-[40px] rounded-tr-[40px] bg-white px-[16px] md:px-[20px] py-[10px] md:py-[12px] shadow-lg">
        <div className="flex-1 min-w-0">
          <LocationAutocomplete
            value={selectedLocation}
            onPick={setSelectedLocation}
            placeholder="Enter city, area or estate..."
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="flex h-[46px] w-[46px] md:h-[52px] md:w-[52px] shrink-0 items-center justify-center rounded-full bg-[#af2525] text-white transition-opacity hover:opacity-90 active:opacity-80"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
      </div>
    </div>
  );
}
