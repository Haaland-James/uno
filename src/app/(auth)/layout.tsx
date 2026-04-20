import { Footer } from "@/components/layout/Footer";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col bg-white">
			<main className="flex flex-1 flex-col">{children}</main>
			<Footer />
		</div>
	);
}
