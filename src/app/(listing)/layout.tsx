import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function ListingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Header />
			<div className="flex">
				<Sidebar />
				<main className="flex-1 min-h-[calc(100vh-4rem)]">
					{children}
				</main>
			</div>
		</>
	);
}
