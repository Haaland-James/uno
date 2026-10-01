import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/clients/favourites", () => ({ favouritesClient: { add: vi.fn() } }));
import { onFavouritesChanged, replayFavourite } from "./favourites-sync";
import { useAuthModalStore } from "@/stores/authModalStore";

// The unit suite runs in node: a bare EventTarget stands in for `window`.
beforeEach(() => vi.stubGlobal("window", new EventTarget()));
afterEach(() => vi.unstubAllGlobals());

describe("replayFavourite (the save that follows a guest's login)", () => {
	it("saves the property, then tells every mounted card to refresh", async () => {
		const order: string[] = [];
		const add = vi.fn(async () => void order.push("saved"));
		const unsubscribe = onFavouritesChanged(() => order.push("refresh"));
		await replayFavourite("p1", add);
		expect(add).toHaveBeenCalledWith("p1");
		expect(order).toEqual(["saved", "refresh"]);
		unsubscribe();
	});

	it("does not refresh when the save fails, and lets the caller toast the error", async () => {
		const listener = vi.fn();
		onFavouritesChanged(listener);
		await expect(replayFavourite("p1", async () => Promise.reject(new Error("nope")))).rejects.toThrow("nope");
		expect(listener).not.toHaveBeenCalled();
	});

	it("stops notifying a hook once it unmounts", async () => {
		const listener = vi.fn();
		onFavouritesChanged(listener)();
		await replayFavourite("p1", async () => {});
		expect(listener).not.toHaveBeenCalled();
	});
});

describe("a guest tapping the heart", () => {
	it("opens the login modal (not a redirect) carrying the favourite as intent", () => {
		useAuthModalStore.getState().openLogin({ type: "favourite", propertyId: "p9" });
		const s = useAuthModalStore.getState();
		expect(s).toMatchObject({ open: true, mode: "login", intent: { type: "favourite", propertyId: "p9" } });
		// After login the modal consumes the intent exactly once.
		expect(s.consumeIntent()).toEqual({ type: "favourite", propertyId: "p9" });
		expect(useAuthModalStore.getState().consumeIntent()).toBeNull();
	});
});
