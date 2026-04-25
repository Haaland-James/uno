import type { SavedSearchCriteria } from "@/lib/validators/saved-search";

export interface SavedSearchDto {
  id: string;
  name: string;
  criteria: SavedSearchCriteria;
  isActive: boolean;
  notifyInstant: boolean;
  notifyEmail: boolean;
  newResultsCount: number;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  return json.data as T;
}

export const savedSearchesClient = {
  list: () => getJson<{ items: SavedSearchDto[]; total: number }>("/api/saved-searches"),
  create: (input: { name: string; criteria: SavedSearchCriteria; notifyInstant?: boolean; notifyEmail?: boolean }) =>
    getJson<SavedSearchDto>("/api/saved-searches", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: { name?: string; isActive?: boolean; notifyInstant?: boolean; notifyEmail?: boolean }) =>
    getJson<SavedSearchDto>(`/api/saved-searches/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    getJson<{ deleted: boolean; id: string }>(`/api/saved-searches/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
