import { create } from "zustand";

interface HeaderState {
	showSearch: boolean;
	setShowSearch: (visible: boolean) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
	showSearch: true,
	setShowSearch: (visible) => set({ showSearch: visible }),
}));
