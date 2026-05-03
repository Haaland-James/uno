"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PropertyCardData } from "@/types/property";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const NG_CENTER: [number, number] = [8.6753, 9.082];
const NG_BBOX: [number, number, number, number] = [2.6917, 4.2406, 14.6776, 13.8659];

export type MapBBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

type MarkerHandle = {
  id: string;
  marker: { remove: () => void; getElement: () => HTMLElement };
};

function formatPriceShort(rent: number, currency = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : "";
  if (rent >= 1_000_000) {
    const v = rent / 1_000_000;
    return `${symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (rent >= 1_000) {
    return `${symbol}${Math.round(rent / 1_000)}K`;
  }
  return `${symbol}${rent}`;
}

function formatPriceFull(rent: number, currency = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : "";
  return `${symbol}${rent.toLocaleString("en-NG")}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function popupHtml(p: PropertyCardData): string {
  const photo = p.photos.find((ph) => ph.isMain)?.url ?? p.photos[0]?.url ?? "";
  const periodSuffix =
    p.listingType === "SALE"
      ? ""
      : p.rentPeriod === "MONTH"
      ? " /mo"
      : p.rentPeriod === "YEAR"
      ? " /yr"
      : "";
  return `
    <a class="search-map-popup" href="/property/${escapeHtml(p.id)}" target="_blank" rel="noopener noreferrer">
      ${
        photo
          ? `<div class="search-map-popup__img" style="background-image:url('${escapeHtml(photo)}')"></div>`
          : `<div class="search-map-popup__img search-map-popup__img--empty"></div>`
      }
      <div class="search-map-popup__body">
        <div class="search-map-popup__price">${escapeHtml(formatPriceFull(p.rent, p.currency))}${escapeHtml(periodSuffix)}</div>
        <div class="search-map-popup__title">${escapeHtml(p.title)}</div>
        <div class="search-map-popup__meta">${p.bedrooms} bd · ${p.bathrooms} ba · ${escapeHtml(p.area)}, ${escapeHtml(p.city)}</div>
      </div>
    </a>
  `;
}

interface SearchMapProps {
  items: PropertyCardData[];
  activeId?: string | null;
  /** Hover/click on a marker bubbles back to parent so the list can sync. */
  onMarkerHover?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  /** Fires on user-initiated pan/zoom only (not programmatic fitBounds). */
  onUserMove?: (bbox: MapBBox) => void;
  className?: string;
}

export function SearchMap({
  items,
  activeId,
  onMarkerHover,
  onMarkerClick,
  onUserMove,
  className,
}: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const popupRef = useRef<unknown>(null);
  const markersRef = useRef<MarkerHandle[]>([]);
  const mapboxRef = useRef<typeof import("mapbox-gl") | null>(null);
  // Tracks whether the next moveend was triggered by our own fitBounds/flyTo.
  // We guard `onUserMove` so programmatic recentre doesn't loop into a refetch.
  const programmaticMoveRef = useRef(false);
  const [ready, setReady] = useState(false);

  const geoItems = useMemo(
    () =>
      items.filter(
        (p): p is PropertyCardData & { latitude: number; longitude: number } =>
          typeof p.latitude === "number" && typeof p.longitude === "number"
      ),
    [items]
  );

  // Initialise map once
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN;
      mapboxRef.current = { default: mapboxgl } as unknown as typeof import("mapbox-gl");

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: NG_CENTER,
        zoom: 5.5,
        maxBounds: [
          [NG_BBOX[0] - 1, NG_BBOX[1] - 1],
          [NG_BBOX[2] + 1, NG_BBOX[3] + 1],
        ],
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("moveend", () => {
        if (programmaticMoveRef.current) {
          programmaticMoveRef.current = false;
          return;
        }
        if (!onUserMoveRef.current) return;
        const b = map.getBounds();
        if (!b) return;
        onUserMoveRef.current({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth(),
        });
      });

      mapRef.current = map;
      map.on("load", () => setReady(true));
    })();
    return () => {
      cancelled = true;
      const popup = popupRef.current as { remove?: () => void } | null;
      popup?.remove?.();
      popupRef.current = null;
      markersRef.current.forEach((h) => h.marker.remove());
      markersRef.current = [];
      const m = mapRef.current as { remove?: () => void } | null;
      m?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Latest callbacks held in refs so the moveend handler stays stable
  // (rebuilding the map handler on every parent rerender would lose listeners).
  const onUserMoveRef = useRef(onUserMove);
  const onMarkerHoverRef = useRef(onMarkerHover);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onUserMoveRef.current = onUserMove;
    onMarkerHoverRef.current = onMarkerHover;
    onMarkerClickRef.current = onMarkerClick;
  });

  // Sync markers to items
  useEffect(() => {
    if (!ready) return;
    const mapboxMod = mapboxRef.current as unknown as { default: typeof import("mapbox-gl").default } | null;
    const mapboxgl = mapboxMod?.default;
    const map = mapRef.current as
      | (import("mapbox-gl").Map & {
          fitBounds: (b: unknown, opts?: unknown) => void;
          flyTo: (o: unknown) => void;
        })
      | null;
    if (!mapboxgl || !map) return;

    // Clear previous markers + popup
    const popup = popupRef.current as { remove?: () => void } | null;
    popup?.remove?.();
    popupRef.current = null;
    markersRef.current.forEach((h) => h.marker.remove());
    markersRef.current = [];

    if (!geoItems.length) return;

    geoItems.forEach((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.dataset.id = p.id;
      el.className =
        "rounded-full px-[8px] py-[3px] text-[11px] font-semibold text-white shadow-md transition-colors cursor-pointer";
      el.style.background = p.id === activeId ? "#af2525" : "#1a4d2e";
      el.textContent = formatPriceShort(p.rent, p.currency);
      el.addEventListener("mouseenter", () => {
        el.style.background = "#af2525";
        onMarkerHoverRef.current?.(p.id);
      });
      el.addEventListener("mouseleave", () => {
        el.style.background = p.id === activeId ? "#af2525" : "#1a4d2e";
        onMarkerHoverRef.current?.(null);
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // Replace any existing popup
        const existing = popupRef.current as { remove?: () => void } | null;
        existing?.remove?.();
        const Popup = mapboxgl.Popup;
        const popup = new Popup({
          offset: 18,
          closeButton: true,
          closeOnClick: true,
          maxWidth: "280px",
          className: "search-map-popup-wrap",
        })
          .setLngLat([p.longitude, p.latitude])
          .setHTML(popupHtml(p))
          .addTo(map);
        popupRef.current = popup;
        onMarkerClickRef.current?.(p.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);
      markersRef.current.push({ id: p.id, marker });
    });

    // Fit bounds programmatically — flag so moveend doesn't fire onUserMove.
    programmaticMoveRef.current = true;
    if (geoItems.length === 1) {
      map.flyTo({ center: [geoItems[0].longitude, geoItems[0].latitude], zoom: 14 });
    } else {
      const bounds = new mapboxgl.LngLatBounds();
      geoItems.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoItems, ready]);

  // Update active marker styling without rebuilding
  useEffect(() => {
    markersRef.current.forEach((h) => {
      const el = h.marker.getElement();
      el.style.background = h.id === activeId ? "#af2525" : "#1a4d2e";
      el.style.zIndex = h.id === activeId ? "5" : "1";
    });
  }, [activeId]);

  if (!TOKEN) {
    return (
      <div className={`flex h-full w-full items-center justify-center rounded-[10px] bg-amber-50 text-[13px] text-amber-900 ${className ?? ""}`}>
        Map unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div ref={containerRef} className="h-full w-full rounded-[10px]" />
      {ready && geoItems.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-white/95 px-3 py-1 text-[12px] text-black/70 shadow-card">
          No properties with map locations match your filters
        </div>
      )}
    </div>
  );
}
