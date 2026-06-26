"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFilterStore } from "@/stores/filterStore";
import {
  propertiesClient,
  type PropertyListParams,
  type FeaturedType,
} from "@/lib/clients/properties";
import type { PropertyCardData } from "@/types/property";

/**
 * Reads filterStore and fetches matching properties from /api/properties.
 * Re-fetches whenever any filter changes (debounced 250ms).
 */
export function useProperties() {
  const filters = useFilterStore();
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const params: PropertyListParams = useMemo(
    () => ({
      city: filters.city || undefined,
      area: filters.area || undefined,
      type: filters.propertyType.length ? filters.propertyType : undefined,
      beds: filters.bedrooms.length ? filters.bedrooms : undefined,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      amenities: filters.amenities.length ? filters.amenities : undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      sort: filters.sortBy ?? undefined,
      pageSize: 30,
    }),
    [
      filters.city,
      filters.area,
      filters.propertyType,
      filters.bedrooms,
      filters.minPrice,
      filters.maxPrice,
      filters.amenities,
      filters.verifiedOnly,
      filters.sortBy,
    ]
  );

  useEffect(() => {
    const myId = ++reqId.current;
    setIsLoading(true);
    setError(null);

    const handle = setTimeout(() => {
      propertiesClient
        .list(params)
        .then((res) => {
          if (myId !== reqId.current) return; // stale
          setProperties(res.items);
          setTotal(res.total);
          setIsLoading(false);
        })
        .catch((e) => {
          if (myId !== reqId.current) return;
          setError(e.message ?? "Could not load properties");
          setProperties([]);
          setTotal(0);
          setIsLoading(false);
        });
    }, 250);

    return () => clearTimeout(handle);
  }, [params]);

  return {
    properties,
    isLoading,
    error,
    totalCount: total,
    isEmpty: !isLoading && properties.length === 0,
  };
}

/** Fetches a single featured carousel by type, optionally narrowed to an area and/or listing type. */
export function useFeaturedProperties(
  type: FeaturedType,
  limit = 8,
  opts?: { area?: string; listingType?: "RENT" | "LEASE" | "SALE" }
) {
  const area = opts?.area;
  const listingType = opts?.listingType;
  const [items, setItems] = useState<PropertyCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    propertiesClient
      .featured(type, limit, area, listingType)
      .then((res) => {
        if (cancelled) return;
        setItems(res);
        setIsLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message ?? "Could not load");
        setItems([]);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, limit, area]);

  return { items, isLoading, error };
}
