"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { savedSearchesClient, type SavedSearchDto } from "@/lib/clients/savedSearches";
import type { SavedSearch, NotificationChannel, NotificationFrequency } from "@/types";
import type { SavedSearchCriteria } from "@/lib/validators/saved-search";
import { toast } from "@/stores/toastStore";

/** Convert API DTO → legacy SavedSearch shape used by the existing UI components. */
function fromDto(d: SavedSearchDto): SavedSearch {
  const channels: NotificationChannel[] = [];
  if (d.notifyEmail) channels.push("email");
  // notifyInstant currently maps to "push" (web/in-app) when no email channel set
  if (d.notifyInstant && !d.notifyEmail) channels.push("push");

  const frequency: NotificationFrequency = d.notifyInstant ? "instant" : channels.length ? "daily" : "never";

  return {
    id: d.id,
    userId: "", // not used by UI
    name: d.name,
    searchType:
      d.criteria.category === "sale"
        ? "For Sale"
        : d.criteria.category === "lease"
        ? "For Lease"
        : "For Rent",
    criteria: d.criteria as Record<string, unknown>,
    isActive: d.isActive,
    notificationsEnabled: d.notifyInstant || d.notifyEmail,
    notificationChannels: channels,
    notificationFrequency: frequency,
    newResultsCount: d.newResultsCount,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}

/** Convert legacy patch shape → API patch payload. */
function toApiPatch(patch: Partial<SavedSearch>) {
  const out: { name?: string; isActive?: boolean; notifyInstant?: boolean; notifyEmail?: boolean } = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.isActive !== undefined) out.isActive = patch.isActive;
  if (patch.notificationsEnabled === false) {
    out.notifyInstant = false;
    out.notifyEmail = false;
  } else if (patch.notificationChannels) {
    out.notifyEmail = patch.notificationChannels.includes("email");
    out.notifyInstant = patch.notificationChannels.includes("push") || patch.notificationFrequency === "instant";
  } else if (patch.notificationFrequency !== undefined) {
    out.notifyInstant = patch.notificationFrequency === "instant";
  }
  return out;
}

export function useSavedSearches() {
  const { status } = useSession();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setSavedSearches([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await savedSearchesClient.list();
      setSavedSearches(res.items.map(fromDto));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load saved searches");
      setSavedSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Create a new saved search from a criteria payload. Used by the Save Search popover. */
  const saveSearch = useCallback(
    async (name: string, criteria: SavedSearchCriteria, opts?: { notifyInstant?: boolean; notifyEmail?: boolean }) => {
      const created = await savedSearchesClient.create({ name, criteria, ...opts });
      setSavedSearches((prev) => [fromDto(created), ...prev]);
      return created;
    },
    []
  );

  const deleteSearch = useCallback(async (id: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    try {
      await savedSearchesClient.remove(id);
      toast.success("Saved search deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete — please try again");
      refresh();
    }
  }, [refresh]);

  const toggleActive = useCallback(async (id: string) => {
    const target = savedSearches.find((s) => s.id === id);
    if (!target) return;
    const next = !target.isActive;
    setSavedSearches((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: next } : s)));
    try {
      await savedSearchesClient.update(id, { isActive: next });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update — please try again");
      refresh();
    }
  }, [savedSearches, refresh]);

  const updateSearch = useCallback(
    async (id: string, patch: Partial<SavedSearch>) => {
      setSavedSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date() } : s))
      );
      try {
        await savedSearchesClient.update(id, toApiPatch(patch));
        toast.success("Saved search updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update — please try again");
        refresh();
      }
    },
    [refresh]
  );

  return {
    savedSearches,
    isLoading,
    error,
    saveSearch,
    deleteSearch,
    toggleActive,
    updateSearch,
  };
}
