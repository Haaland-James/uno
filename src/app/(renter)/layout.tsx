"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BrowseHeader } from "@/components/layout/BrowseHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function RenterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isPropertyDetail = pathname?.startsWith("/property/") ?? false;

	return (
		<div className="flex min-h-screen flex-col">
			{isPropertyDetail ? <BrowseHeader /> : <Header />}
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
