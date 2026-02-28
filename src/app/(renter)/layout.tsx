import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";

export default function RenterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Header />
			<main className="safe-bottom">{children}</main>
			<Footer />
			<MobileNav />
		</>
	);
}
