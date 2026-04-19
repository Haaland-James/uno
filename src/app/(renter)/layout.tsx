import { GuestHeader } from "@/components/layout/GuestHeader";
import { Footer } from "@/components/layout/Footer";

export default function RenterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<GuestHeader />
			<main>{children}</main>
			<Footer />
		</>
	);
}
