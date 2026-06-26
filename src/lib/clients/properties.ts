import type { PropertyCardData, PropertyDetailData, MapPin } from "@/types/property";

export type FeaturedType = "latest" | "hot" | "virgin" | "top";

export interface PropertyListParams {
  q?: string;
  ids?: string[];
  listingType?: ("RENT" | "LEASE" | "SALE")[];
  city?: string;
  cities?: string[];
  area?: string;
  type?: string[];
  minPrice?: number;
  maxPrice?: number;
  beds?: number[];
  baths?: number[];
  furnishing?: string[];
  amenities?: string[];
  verifiedOnly?: boolean;
  availableNow?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "most_viewed";
  minLng?: number;
  minLat?: number;
  maxLng?: number;
  maxLat?: number;
  page?: number;
  pageSize?: number;
}

export interface PropertyListResult {
  items: PropertyCardData[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    sp.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json.data as T;
}

export const propertiesClient = {
  list: (params: PropertyListParams = {}) =>
    getJson<PropertyListResult>(
      `/api/properties${toQuery(params as unknown as Record<string, unknown>)}`
    ),

  detail: (id: string) =>
    getJson<PropertyDetailData>(`/api/properties/${encodeURIComponent(id)}`),

  similar: (id: string, limit = 6) =>
    getJson<{ items: PropertyCardData[] }>(
      `/api/properties/${encodeURIComponent(id)}/similar?limit=${limit}`
    ).then((d) => d.items),

  /** Lightweight pins for the map at a given bbox + filters. */
  mapPins: (params: PropertyListParams & {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  }) =>
    getJson<{ pins: MapPin[]; total: number; capped: boolean }>(
      `/api/properties/map${toQuery(params as unknown as Record<string, unknown>)}`
    ),

  featured: (type: FeaturedType, limit = 8, area?: string, listingType?: "RENT" | "LEASE" | "SALE") =>
    getJson<{ type: FeaturedType; items: PropertyCardData[] }>(
      `/api/properties/featured?type=${type}&limit=${limit}${area ? `&area=${encodeURIComponent(area)}` : ""}${listingType ? `&listingType=${listingType}` : ""}`
    ).then((d) => d.items),
};
