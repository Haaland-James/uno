"use client";

import { useUserStore } from "@/stores/userStore";

export function useAuth() {
	const { user, isAuthenticated, isLoading, setUser, logout } = useUserStore();

	const login = async (phone: string) => {
		// TODO: Implement actual auth with NextAuth
		setUser({
			id: "mock_user_1",
			phone,
			phoneVerified: true,
			emailVerified: false,
			name: "Test User",
			role: "RENTER",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	};

	return {
		user,
		isAuthenticated,
		isLoading,
		login,
		logout,
	};
}
