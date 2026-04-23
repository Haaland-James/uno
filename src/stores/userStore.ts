import { create } from "zustand";
import type { User, Role } from "@/types";

interface UserState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;

	setUser: (user: User | null) => void;
	updateUser: (patch: Partial<User>) => void;
	setLoading: (loading: boolean) => void;
	logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
	user: null,
	isAuthenticated: false,
	isLoading: true,

	setUser: (user) =>
		set({
			user,
			isAuthenticated: !!user,
			isLoading: false,
		}),

	updateUser: (patch) =>
		set((state) =>
			state.user
				? { user: { ...state.user, ...patch, updatedAt: new Date() } }
				: state
		),

	setLoading: (isLoading) => set({ isLoading }),

	logout: () =>
		set({
			user: null,
			isAuthenticated: false,
			isLoading: false,
		}),
}));
