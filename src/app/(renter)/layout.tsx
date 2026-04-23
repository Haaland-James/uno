"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useUserStore } from "@/stores/userStore";

export default function RenterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isPropertyDetail = pathname?.startsWith("/property/") ?? false;
	const setUser = useUserStore((s) => s.setUser);
	const user = useUserStore((s) => s.user);

	// Set a mock authenticated user for development
	useEffect(() => {
		if (!user) {
			setUser({
				id: "user_001",
				phone: "+2348012345678",
				phoneVerified: true,
				email: "james@example.com",
				emailVerified: true,
				name: "James Okon",
				photo: null,
				role: "RENTER",
				createdAt: new Date("2025-01-15"),
				updatedAt: new Date("2025-02-10"),
			});
		}
	}, [user, setUser]);

	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<div className="flex flex-1">
				{!isPropertyDetail && <Sidebar />}
				<main
					className={
						isPropertyDetail
							? "flex-1"
							: "flex-1 overflow-y-auto pb-16 md:pb-0"
					}
				>
					{children}
				</main>
			</div>
			{!isPropertyDetail && <MobileNav />}
		</div>
	);
}
