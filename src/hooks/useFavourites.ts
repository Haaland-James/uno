"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAuthModalStore } from "@/stores/authModalStore";
import { favouritesClient } from "@/lib/clients/favourites";

/**
 * Manages the user's favourited property IDs. For authenticated users, hits
 * /api/favourites; for guests, opens the auth modal with intent so the
 * favourite saves automatically post-signin (see AuthModal.handleAuthSuccess).
 */
export function useFavourites() {
  const { status } = useSession();
  const openLogin = useAuthModalStore((s) => s.openLogin);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Hydrate from server when authenticated
  useEffect(() => {
    if (status !== "authenticated") {
      setIds(new Set());
      return;
    }
    setLoading(true);
    favouritesClient
      .list()
      .then((res) => setIds(new Set(res.items.map((p) => p.id))))
      .catch(() => {
        // best-effort; leave empty on failure
      })
      .finally(() => setLoading(false));
  }, [status]);

  const toggleFavourite = useCallback(
    async (propertyId: string) => {
      if (status !== "authenticated") {
        openLogin({ type: "favourite", propertyId });
        return;
      }
      // Optimistic toggle
      const wasFav = ids.has(propertyId);
      const next = new Set(ids);
      if (wasFav) next.delete(propertyId);
      else next.add(propertyId);
      setIds(next);

      try {
        if (wasFav) {
          await favouritesClient.remove(propertyId);
        } else {
          await favouritesClient.add(propertyId);
        }
      } catch {
        // Revert on failure
        setIds(ids);
      }
    },
    [ids, status, openLogin]
  );

  const isFavourited = useCallback((propertyId: string) => ids.has(propertyId), [ids]);

  return {
    favourites: ids,
    favouriteCount: ids.size,
    toggleFavourite,
    isFavourited,
    loading,
  };
}
