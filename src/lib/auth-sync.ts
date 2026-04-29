/**
 * Cross-tab auth sync.
 *
 * Without this, each tab has its own NextAuth session cache. Sign out in
 * tab A and tab B keeps showing the user as logged in until it happens
 * to refetch (window focus, page nav, default refetchInterval).
 *
 * With this, every sign-in / sign-out broadcasts a message; other tabs
 * receive it and force a session refetch immediately.
 */

const CHANNEL_NAME = "uno-auth";

export type AuthSyncEvent =
  | { type: "signed-in" }
  | { type: "signed-out" };

type Listener = (e: AuthSyncEvent) => void;

let channel: BroadcastChannel | null = null;
const listeners = new Set<Listener>();

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (channel) return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (e: MessageEvent<AuthSyncEvent>) => {
    if (!e.data || typeof e.data !== "object" || !("type" in e.data)) return;
    listeners.forEach((fn) => fn(e.data));
  };
  return channel;
}

/** Tell all other tabs that auth state changed in this tab. */
export function broadcastAuthChange(event: AuthSyncEvent) {
  const ch = getChannel();
  ch?.postMessage(event);
}

/** Subscribe to auth-change events from other tabs. Returns unsubscribe fn. */
export function onAuthChange(listener: Listener): () => void {
  getChannel(); // ensure channel exists
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
