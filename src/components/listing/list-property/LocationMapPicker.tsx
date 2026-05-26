"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, AlertTriangle } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

interface LocationMapPickerProps {
	addressQuery: string;
	latitude: number | null;
	longitude: number | null;
	onLocationChange: (next: {
		latitude: number;
		longitude: number;
		geocodeAccuracy: string;
		resolvedAddress?: string;
	}) => void;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
// Bounding box to keep the picker focused on Nigeria.
const NG_BBOX: [number, number, number, number] = [2.6917, 4.2406, 14.6776, 13.8659];
const NG_CENTER: [number, number] = [8.6753, 9.082];

type GeocodeFeature = {
	center: [number, number];
	place_name: string;
	accuracy?: string;
};

/**
 * Forward + reverse geocode both go through our server proxies so the Mapbox
 * geocoding token stays out of the client bundle. The map *tiles* still use
 * `NEXT_PUBLIC_MAPBOX_TOKEN` (URL-restricted in the Mapbox dashboard) — that's
 * unavoidable since tiles load directly from the browser.
 */
async function geocode(query: string, signal: AbortSignal): Promise<GeocodeFeature | null> {
	if (!query.trim()) return null;
	const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=1`, { signal });
	if (!res.ok) return null;
	const json = (await res.json()) as { data?: { features?: GeocodeFeature[] } };
	return json.data?.features?.[0] ?? null;
}

async function reverseGeocode(
	lng: number,
	lat: number,
	signal: AbortSignal
): Promise<GeocodeFeature | null> {
	const res = await fetch(`/api/reverse-geocode?lng=${lng}&lat=${lat}`, { signal });
	if (!res.ok) return null;
	const json = (await res.json()) as { data?: { feature?: GeocodeFeature | null } };
	return json.data?.feature ?? null;
}

export function LocationMapPicker({
	addressQuery,
	latitude,
	longitude,
	onLocationChange,
}: LocationMapPickerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<unknown>(null);
	const markerRef = useRef<unknown>(null);
	const [ready, setReady] = useState(false);

	// Initialise the map once.
	useEffect(() => {
		if (!TOKEN || !containerRef.current) return;
		let cancelled = false;
		(async () => {
			const mapboxgl = (await import("mapbox-gl")).default;
			if (cancelled || !containerRef.current) return;
			mapboxgl.accessToken = TOKEN;

			const initialCenter: [number, number] =
				latitude !== null && longitude !== null
					? [longitude, latitude]
					: NG_CENTER;

			const map = new mapboxgl.Map({
				container: containerRef.current,
				style: "mapbox://styles/mapbox/streets-v12",
				center: initialCenter,
				zoom: latitude !== null && longitude !== null ? 15 : 5.5,
				maxBounds: [
					[NG_BBOX[0] - 1, NG_BBOX[1] - 1],
					[NG_BBOX[2] + 1, NG_BBOX[3] + 1],
				],
			});

			const marker = new mapboxgl.Marker({ draggable: true, color: "#af2525" })
				.setLngLat(initialCenter)
				.addTo(map);

			marker.on("dragend", async () => {
				const lngLat = marker.getLngLat();
				const ctrl = new AbortController();
				const feature = await reverseGeocode(lngLat.lng, lngLat.lat, ctrl.signal).catch(
					() => null
				);
				onLocationChange({
					latitude: lngLat.lat,
					longitude: lngLat.lng,
					geocodeAccuracy: "user_dragged",
					resolvedAddress: feature?.place_name,
				});
			});

			mapRef.current = map;
			markerRef.current = marker;
			setReady(true);
		})();
		return () => {
			cancelled = true;
			const m = mapRef.current as { remove?: () => void } | null;
			m?.remove?.();
			mapRef.current = null;
			markerRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// When parent provides new lat/lng (e.g. from geocoding the address), recenter.
	useEffect(() => {
		if (!ready || latitude === null || longitude === null) return;
		const map = mapRef.current as {
			flyTo: (o: { center: [number, number]; zoom: number }) => void;
		} | null;
		const marker = markerRef.current as {
			setLngLat: (c: [number, number]) => void;
		} | null;
		map?.flyTo({ center: [longitude, latitude], zoom: 15 });
		marker?.setLngLat([longitude, latitude]);
	}, [latitude, longitude, ready]);

	// Debounced forward geocode whenever the address query changes.
	useEffect(() => {
		if (!TOKEN || !addressQuery.trim()) return;
		const ctrl = new AbortController();
		const t = setTimeout(async () => {
			const feature = await geocode(addressQuery, ctrl.signal).catch(() => null);
			if (!feature) return;
			const [lng, lat] = feature.center;
			onLocationChange({
				latitude: lat,
				longitude: lng,
				geocodeAccuracy: feature.accuracy ?? "geocoded",
				resolvedAddress: feature.place_name,
			});
		}, 700);
		return () => {
			clearTimeout(t);
			ctrl.abort();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [addressQuery]);

	if (!TOKEN) {
		return (
			<div className="relative overflow-hidden rounded-[18px] border border-amber-300 bg-amber-50 p-5 text-amber-900">
				<div className="flex items-start gap-3">
					<AlertTriangle size={18} className="mt-0.5 shrink-0" />
					<div className="text-[13px]">
						<p className="font-semibold">Mapbox token not configured</p>
						<p className="mt-1 leading-relaxed">
							Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
							in <code className="rounded bg-amber-100 px-1">.env.local</code> to enable
							the live map. The form will still save your address — only the map preview
							and pin-drop are disabled.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative overflow-hidden rounded-[18px] border border-black/10 bg-[#f5f3ee]">
			<div ref={containerRef} className="h-[280px] w-full" />
			<div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-[12px] text-black/70 shadow-card">
				<MapPin size={12} className="-mt-0.5 mr-1 inline" />
				Drag the pin if it&apos;s not exactly right
			</div>
		</div>
	);
}
