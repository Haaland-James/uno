"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import type { PropertyCardData, MapPin } from "@/types/property";
import { PRIVACY_RADIUS_M } from "@/lib/privacy";

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
  /** id of the single pin, or `cluster_<n>` for a cluster */
  key: string;
  /** ids covered by this marker — `[id]` for a single pin, all leaf ids for a cluster */
  ids: string[];
  isCluster: boolean;
  marker: { remove: () => void; getElement: () => HTMLElement };
};

type PinProps = {
  id: string;
  rent: number;
  currency: string;
  addressPrivate: boolean;
};

function formatPriceShort(rent: number, currency = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : "";
  if (rent >= 1_000_000) {
    const v = rent / 1_000_000;
    return `${symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (rent >= 1_000) return `${symbol}${Math.round(rent / 1_000)}K`;
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

/** Placeholder popup shown while we fetch the full card for an off-page pin. */
function popupSkeletonHtml(pin: PinProps): string {
  return `
    <div class="search-map-popup">
      <div class="search-map-popup__img search-map-popup__img--empty"></div>
      <div class="search-map-popup__body">
        <div class="search-map-popup__price">${escapeHtml(formatPriceFull(pin.rent, pin.currency))}</div>
        <div class="search-map-popup__meta">Loading…</div>
      </div>
    </div>
  `;
}

async function fetchCard(id: string): Promise<PropertyCardData | null> {
  try {
    const res = await fetch(`/api/properties/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: PropertyCardData };
    return json.data ?? null;
  } catch {
    return null;
  }
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
  /** Lightweight pins for the whole bbox — drives cluster rendering. */
  pins?: MapPin[];
  /** Full cards for the currently-visible result page — used for popup content. */
  items: PropertyCardData[];
  activeId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  /** Fires on user-initiated pan/zoom only (not programmatic fitBounds). */
  onUserMove?: (bbox: MapBBox) => void;
  className?: string;
}

export function SearchMap({
  pins,
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
  const clusterRef = useRef<Supercluster<PinProps> | null>(null);
  // Set true right before any programmatic fitBounds/flyTo/easeTo so the
  // resulting `moveend` doesn't fire onUserMove and trigger a refetch loop.
  const programmaticMoveRef = useRef(false);
  const [ready, setReady] = useState(false);
  // The pin currently anchoring an open popup (cleared when the popup closes).
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  /**
   * The effective pin set the cluster index works on. When the page only
   * passes `items` (legacy callers), we fall back to deriving pins from items
   * so the map still works without the new lightweight endpoint.
   */
  const effectivePins: MapPin[] = useMemo(() => {
    if (pins?.length) return pins;
    return items
      .filter(
        (p): p is PropertyCardData & { latitude: number; longitude: number } =>
          typeof p.latitude === "number" && typeof p.longitude === "number"
      )
      .map((p) => ({
        id: p.id,
        lng: p.longitude,
        lat: p.latitude,
        rent: p.rent,
        currency: p.currency,
        addressPrivate: !!p.addressPrivate,
      }));
  }, [pins, items]);

  // Lookup card by id for popups (only items on the current page have full data).
  const itemsById = useMemo(() => {
    const m = new Map<string, PropertyCardData>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  // Latest callbacks held in refs so the moveend handler stays stable
  // (rebuilding the map handler on every parent rerender would lose listeners).
  const onUserMoveRef = useRef(onUserMove);
  const onMarkerHoverRef = useRef(onMarkerHover);
  const onMarkerClickRef = useRef(onMarkerClick);
  const itemsByIdRef = useRef(itemsById);
  useEffect(() => {
    onUserMoveRef.current = onUserMove;
    onMarkerHoverRef.current = onMarkerHover;
    onMarkerClickRef.current = onMarkerClick;
    itemsByIdRef.current = itemsById;
  });

  // Initialise the map once.
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

      map.on("load", () => {
        // Privacy radius source + layer. Source is empty until pins arrive.
        map.addSource("privacy-radius", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "privacy-radius-fill",
          type: "circle",
          source: "privacy-radius",
          paint: {
            "circle-color": "#af2525",
            "circle-opacity": 0.08,
            "circle-stroke-color": "#af2525",
            "circle-stroke-opacity": 0.25,
            "circle-stroke-width": 1,
            // Translate 500m → screen pixels at the current zoom.
            // 156543.03 = metres-per-pixel at the equator at zoom 0.
            "circle-radius": [
              "interpolate",
              ["exponential", 2],
              ["zoom"],
              0,
              ["/", ["*", PRIVACY_RADIUS_M, Math.pow(2, 0)], 156543.03],
              22,
              ["/", ["*", PRIVACY_RADIUS_M, Math.pow(2, 22)], 156543.03],
            ],
          },
        });
        setReady(true);
      });

      map.on("moveend", () => {
        // Always re-render clusters when the map settles — even programmatic moves,
        // since the new viewport may resolve to different cluster groupings.
        renderClusters();
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

  /**
   * Rebuild the cluster index whenever the pin set changes. Re-runs cluster
   * rendering for the current viewport once the index is fresh.
   */
  useEffect(() => {
    if (!ready) return;
    const idx = new Supercluster<PinProps>({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });
    idx.load(
      effectivePins.map((p) => ({
        type: "Feature" as const,
        properties: {
          id: p.id,
          rent: p.rent,
          currency: p.currency,
          addressPrivate: p.addressPrivate,
        },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      }))
    );
    clusterRef.current = idx;

    // Fit map to pins on first load, otherwise leave the viewport alone so the
    // user's pan/zoom is preserved across refetches.
    const map = mapRef.current as
      | (import("mapbox-gl").Map & {
          fitBounds: (b: unknown, opts?: unknown) => void;
          flyTo: (o: unknown) => void;
        })
      | null;
    const mapboxMod = mapboxRef.current as unknown as { default: typeof import("mapbox-gl").default } | null;
    const mapboxgl = mapboxMod?.default;
    if (map && mapboxgl && markersRef.current.length === 0 && effectivePins.length) {
      programmaticMoveRef.current = true;
      if (effectivePins.length === 1) {
        map.flyTo({ center: [effectivePins[0].lng, effectivePins[0].lat], zoom: 14 });
      } else {
        const bounds = new mapboxgl.LngLatBounds();
        effectivePins.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
      }
      // The moveend handler will call renderClusters once the fit completes.
    } else {
      renderClusters();
    }

    // Privacy radius features rebuild with every pin set.
    syncPrivacyLayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePins, ready]);

  // Re-sync the privacy circle when hover/selection changes so it follows the
  // active pin without rebuilding the cluster index.
  useEffect(() => {
    if (!ready) return;
    syncPrivacyLayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, selectedPinId, ready]);

  function syncPrivacyLayer() {
    const map = mapRef.current as import("mapbox-gl").Map | null;
    if (!map) return;
    const src = map.getSource("privacy-radius") as
      | { setData: (d: GeoJSON.FeatureCollection) => void }
      | undefined;
    if (!src) return;
    // Only emit the circle for the pin the user is currently engaging with
    // (hover from list, selected popup) — drawing one per private listing
    // floods the map at high zoom when every listing is privacy-on by default.
    const focusIds = new Set<string>();
    if (activeId) focusIds.add(activeId);
    if (selectedPinId) focusIds.add(selectedPinId);
    const features: GeoJSON.Feature[] = effectivePins
      .filter((p) => p.addressPrivate && focusIds.has(p.id))
      .map((p) => ({
        type: "Feature",
        properties: { id: p.id },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      }));
    src.setData({ type: "FeatureCollection", features });
  }

  function renderClusters() {
    const map = mapRef.current as
      | (import("mapbox-gl").Map & { getZoom: () => number; getBounds: () => import("mapbox-gl").LngLatBounds | null })
      | null;
    const mapboxMod = mapboxRef.current as unknown as { default: typeof import("mapbox-gl").default } | null;
    const mapboxgl = mapboxMod?.default;
    const idx = clusterRef.current;
    if (!map || !mapboxgl || !idx) return;

    const bounds = map.getBounds();
    if (!bounds) return;
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const zoom = Math.round(map.getZoom());
    const clusters = idx.getClusters(bbox, zoom);

    markersRef.current.forEach((h) => h.marker.remove());
    markersRef.current = [];

    for (const c of clusters) {
      const [lng, lat] = c.geometry.coordinates;
      const props = c.properties as { cluster?: boolean; cluster_id?: number; point_count?: number } & PinProps;

      if (props.cluster) {
        const clusterId = props.cluster_id!;
        const count = props.point_count!;
        const leafIds = idx
          .getLeaves(clusterId, Infinity)
          .map((l) => (l.properties as PinProps).id);

        const el = document.createElement("button");
        el.type = "button";
        el.className =
          "flex items-center justify-center rounded-full text-white font-semibold shadow-md transition-transform cursor-pointer";
        const size = count >= 100 ? 44 : count >= 10 ? 38 : 32;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.fontSize = "12px";
        el.style.background = "#161515";
        el.textContent = String(count);

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.08)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "";
        });
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const expansionZoom = Math.min(idx.getClusterExpansionZoom(clusterId), 18);
          programmaticMoveRef.current = true;
          (map as unknown as { easeTo: (o: unknown) => void }).easeTo({
            center: [lng, lat],
            zoom: expansionZoom,
            duration: 400,
          });
        });

        const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        markersRef.current.push({
          key: `cluster_${clusterId}`,
          ids: leafIds,
          isCluster: true,
          marker,
        });
      } else {
        const pin = props;
        const isActive = pin.id === activeId;
        const el = document.createElement("button");
        el.type = "button";
        el.dataset.id = pin.id;
        el.className =
          "rounded-full px-[8px] py-[3px] text-[11px] font-semibold text-white shadow-md transition-colors cursor-pointer";
        el.style.background = isActive ? "#af2525" : "#1a4d2e";
        el.textContent = formatPriceShort(pin.rent, pin.currency);

        el.addEventListener("mouseenter", () => {
          el.style.background = "#af2525";
          onMarkerHoverRef.current?.(pin.id);
        });
        el.addEventListener("mouseleave", () => {
          el.style.background = pin.id === activeId ? "#af2525" : "#1a4d2e";
          onMarkerHoverRef.current?.(null);
        });
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const existing = popupRef.current as { remove?: () => void } | null;
          existing?.remove?.();

          const Popup = mapboxgl.Popup;
          const card = itemsByIdRef.current.get(pin.id);
          const popup = new Popup({
            offset: 18,
            closeButton: true,
            closeOnClick: true,
            maxWidth: "280px",
            className: "search-map-popup-wrap",
          })
            .setLngLat([lng, lat])
            .setHTML(card ? popupHtml(card) : popupSkeletonHtml(pin))
            .addTo(map);
          popupRef.current = popup;
          setSelectedPinId(pin.id);
          popup.on("close", () => {
            if (popupRef.current === popup) popupRef.current = null;
            setSelectedPinId((cur) => (cur === pin.id ? null : cur));
          });

          // Lazy-fetch the full card when the pin isn't on the current results
          // page — the bbox endpoint returns pins map-wide but list is paginated.
          if (!card) {
            void fetchCard(pin.id).then((fetched) => {
              if (!fetched) return;
              if (popupRef.current !== popup) return; // user moved on
              popup.setHTML(popupHtml(fetched));
            });
          }
          onMarkerClickRef.current?.(pin.id);
        });

        const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        markersRef.current.push({
          key: pin.id,
          ids: [pin.id],
          isCluster: false,
          marker,
        });
      }
    }
  }

  // Active-id styling without rebuilding all markers. Cluster markers covering
  // the active id get a subtle ring; single markers swap to red.
  useEffect(() => {
    markersRef.current.forEach((h) => {
      const el = h.marker.getElement();
      const covers = activeId ? h.ids.includes(activeId) : false;
      if (h.isCluster) {
        el.style.boxShadow = covers ? "0 0 0 3px #af2525" : "";
        el.style.zIndex = covers ? "5" : "1";
      } else {
        el.style.background = covers ? "#af2525" : "#1a4d2e";
        el.style.zIndex = covers ? "5" : "1";
      }
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
      {ready && effectivePins.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-white/95 px-3 py-1 text-[12px] text-black/70 shadow-card">
          No properties with map locations match your filters
        </div>
      )}
    </div>
  );
}
