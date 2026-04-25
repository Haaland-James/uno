import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  /** Auto-dismiss delay in ms; null = persistent until manually closed */
  durationMs: number | null;
}

interface ToastState {
  toasts: Toast[];
  /** Push a new toast onto the queue. Returns the toast id. */
  push: (input: { kind?: ToastKind; message: string; durationMs?: number | null }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: ({ kind = "info", message, durationMs = 4000 }) => {
    const id = `t_${Date.now()}_${++counter}`;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message, durationMs }] }));
    if (durationMs !== null) {
      setTimeout(() => get().dismiss(id), durationMs);
    }
    return id;
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

// ─── Convenience helpers (use anywhere — client side) ──────────────
export const toast = {
  success: (message: string, durationMs?: number) =>
    useToastStore.getState().push({ kind: "success", message, durationMs }),
  error: (message: string, durationMs?: number) =>
    useToastStore.getState().push({ kind: "error", message, durationMs }),
  info: (message: string, durationMs?: number) =>
    useToastStore.getState().push({ kind: "info", message, durationMs }),
};
