"use client";

import { useCallback, useEffect, useState } from "react";
import { propertiesClient } from "@/lib/clients/properties";
import type { PropertyCardData } from "@/types/property";

const KEY = "uno:recently-viewed:v1";
const MAX_ENTRIES = 12;

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
  } catch {
    /* quota exceeded — ignore */
  }
}

/** Push a propertyId to the front of the recently-viewed list (deduped). */
export function trackPropertyView(propertyId: string) {
  if (!propertyId) return;
  const current = readIds().filter((id) => id !== propertyId);
  current.unshift(propertyId);
  writeIds(current);
}

/**
 * Returns the user's recently viewed properties as full card data.
 * Empty array if they haven't viewed anything yet.
 */
export function useRecentlyViewed(limit = 9) {
  const [items, setItems] = useState<PropertyCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const ids = readIds().slice(0, limit);
    if (ids.length === 0) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await propertiesClient.list({
        ids,
        pageSize: limit,
      } as Parameters<typeof propertiesClient.list>[0] & { ids: string[] });
      // Re-order to match the localStorage order
      const byId = new Map(res.items.map((p) => [p.id, p]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as PropertyCardData[];
      setItems(ordered);
    } catch {
      setItems([]);
    }
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, isLoading, refresh };
}
