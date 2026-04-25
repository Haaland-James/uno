"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Building2, Home } from "lucide-react";
import { searchCoverage, type LocationNode } from "@/lib/coverage";
import { cn } from "@/lib/utils";

interface LocationAutocompleteProps {
  /** Display value of currently picked node, if any */
  value?: LocationNode | null;
  /** Called when the user picks a covered location from the dropdown */
  onPick: (node: LocationNode) => void;
  /** Called when the user expressed interest in an uncovered area (waitlist signal) */
  onWaitlistRequest?: (locationName: string) => void;
  placeholder?: string;
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

const TYPE_ICON = {
  state: MapPin,
  city: Building2,
  area: Home,
} as const;

export function LocationAutocomplete({
  value,
  onPick,
  onWaitlistRequest,
  placeholder = "City, state, or area",
  className,
  autoFocus,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes into the input
  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const result = searchCoverage(query);

  function pick(node: LocationNode) {
    setQuery(node.name);
    setOpen(false);
    onPick(node);
  }

  function handleEnter() {
    if (result.kind === "matches" && result.nodes[0]) {
      pick(result.nodes[0]);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="flex h-[50px] items-center gap-3 rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-4 focus-within:border-[#af2525] focus-within:ring-1 focus-within:ring-[#af2525]">
        <Search className="h-4 w-4 flex-shrink-0 text-black/40" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleEnter();
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-black/40"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[400px] overflow-y-auto rounded-[16px] border border-black/10 bg-white py-2 shadow-[0px_8px_24px_rgba(0,0,0,0.12)]">
          {result.kind === "popular" && (
            <>
              <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                Popular locations
              </div>
              {result.nodes.map((n) => (
                <DropdownRow key={n.slug} node={n} onPick={pick} />
              ))}
              {result.nodes.length === 0 && (
                <div className="px-4 py-3 text-[14px] text-black/50">
                  Start typing a state, city, or area
                </div>
              )}
            </>
          )}

          {result.kind === "matches" && (
            <>
              {result.nodes.map((n) => (
                <DropdownRow key={n.slug} node={n} onPick={pick} highlight={query} />
              ))}
              {result.expansions.map(({ node, children }) =>
                children.length > 0 ? (
                  <div key={`exp-${node.slug}`} className="border-t border-black/5 mt-2 pt-2">
                    <div className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                      Popular in {node.name}
                    </div>
                    {children.map((c) => (
                      <DropdownRow key={c.slug} node={c} onPick={pick} />
                    ))}
                  </div>
                ) : null
              )}
            </>
          )}

          {result.kind === "uncovered" && (
            <div className="px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#fff5f5]">
                  <MapPin size={18} className="text-[#af2525]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-black">
                    We don&apos;t cover {result.name} yet
                  </div>
                  <div className="mt-1 text-[13px] text-black/60">
                    UNO is rolling out state by state.
                    {onWaitlistRequest && " Get notified when we launch in your area."}
                  </div>
                  {onWaitlistRequest && (
                    <button
                      type="button"
                      onClick={() => {
                        onWaitlistRequest(result.name);
                        setOpen(false);
                      }}
                      className="mt-3 inline-flex h-[34px] items-center rounded-full bg-[#af2525] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#93191d]"
                    >
                      Notify me
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {result.kind === "no_match" && (
            <div className="px-4 py-3 text-[14px] text-black/60">
              No matches. UNO currently operates in <span className="font-medium text-black">Akwa Ibom</span> with more states coming soon.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownRow({
  node,
  onPick,
  highlight,
}: {
  node: LocationNode;
  onPick: (n: LocationNode) => void;
  highlight?: string;
}) {
  const Icon = TYPE_ICON[node.type];
  return (
    <button
      type="button"
      onClick={() => onPick(node)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#faf9f9]"
    >
      <Icon size={16} className="flex-shrink-0 text-black/40" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] text-black">
          {highlight ? <Highlight text={node.name} hl={highlight} /> : node.name}
        </div>
        <div className="text-[11px] text-black/40">
          {node.type === "state"
            ? "State"
            : node.type === "city"
            ? "City"
            : "Area"}
          {node.popular && " · Popular"}
        </div>
      </div>
    </button>
  );
}

function Highlight({ text, hl }: { text: string; hl: string }) {
  const lower = text.toLowerCase();
  const i = lower.indexOf(hl.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-[#af2525]">{text.slice(i, i + hl.length)}</span>
      {text.slice(i + hl.length)}
    </>
  );
}
