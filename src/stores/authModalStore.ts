import { create } from "zustand";

export type AuthModalMode = "login" | "signup" | "verify";

import type { SavedSearchCriteria } from "@/lib/validators/saved-search";

export type AuthIntent =
  | { type: "favourite"; propertyId: string }
  | { type: "save_search"; name: string; criteria: SavedSearchCriteria }
  | { type: "contact"; propertyId: string };

interface VerifyContext {
  email: string;
  mode: "SIGNUP" | "LOGIN";
  name?: string;
  phone?: string;
  devCode?: string;
}

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  intent: AuthIntent | null;
  verifyCtx: VerifyContext | null;

  openLogin: (intent?: AuthIntent) => void;
  openSignup: (intent?: AuthIntent) => void;
  switchTo: (mode: AuthModalMode) => void;
  goToVerify: (ctx: VerifyContext) => void;
  close: () => void;
  consumeIntent: () => AuthIntent | null;
}

export const useAuthModalStore = create<AuthModalState>((set, get) => ({
  open: false,
  mode: "login",
  intent: null,
  verifyCtx: null,

  openLogin: (intent) =>
    set({ open: true, mode: "login", intent: intent ?? null, verifyCtx: null }),

  openSignup: (intent) =>
    set({ open: true, mode: "signup", intent: intent ?? null, verifyCtx: null }),

  switchTo: (mode) => set({ mode, verifyCtx: null }),

  goToVerify: (ctx) => set({ mode: "verify", verifyCtx: ctx }),

  close: () => set({ open: false, verifyCtx: null }),

  consumeIntent: () => {
    const intent = get().intent;
    if (intent) set({ intent: null });
    return intent;
  },
}));
