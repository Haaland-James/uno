import type { PropertyCardData } from "@/types/property";

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  return json.data as T;
}

export const favouritesClient = {
  list: () => getJson<{ items: PropertyCardData[]; total: number }>("/api/favourites"),
  add: (propertyId: string) =>
    getJson<{ favourited: boolean; propertyId: string; alreadyFavourited?: boolean }>(
      `/api/favourites/${encodeURIComponent(propertyId)}`,
      { method: "POST" }
    ),
  remove: (propertyId: string) =>
    getJson<{ favourited: boolean; propertyId: string }>(
      `/api/favourites/${encodeURIComponent(propertyId)}`,
      { method: "DELETE" }
    ),
};
