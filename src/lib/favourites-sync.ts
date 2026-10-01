import { favouritesClient } from "@/lib/clients/favourites";

/**
 * Every page owns its own `useFavourites()` state, so a favourite saved outside
 * a hook (the post-login intent replay in AuthModal) would leave hearts empty
 * until a reload. Writers announce the change here; every mounted hook listens
 * and refetches.
 */
export const FAVOURITES_CHANGED = "uno:favourites-changed";

export function announceFavouritesChanged(): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(FAVOURITES_CHANGED));
}

/** Subscribe to favourite changes made elsewhere on the page. Returns the unsubscribe. */
export function onFavouritesChanged(listener: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	window.addEventListener(FAVOURITES_CHANGED, listener);
	return () => window.removeEventListener(FAVOURITES_CHANGED, listener);
}

/**
 * Save the favourite a guest tapped before logging in, then tell every card to
 * refresh. A failed save rethrows (the caller toasts) and announces nothing.
 */
export async function replayFavourite(
	propertyId: string,
	add: (id: string) => Promise<unknown> = favouritesClient.add,
): Promise<void> {
	await add(propertyId);
	announceFavouritesChanged();
}
