import { GuestHeader } from "@/components/layout/GuestHeader";
import { Footer } from "@/components/layout/Footer";

/**
 * Chrome for the public periphery: legal documents and contact.
 *
 * Mirrors (auth)/layout.tsx but adds the guest header. Pages in this group
 * stay server components so each can export its own metadata — the homepage
 * can't, being "use client".
 */
export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col bg-white">
			<GuestHeader />
			<main className="flex-1">{children}</main>
			<Footer />
		</div>
	);
}
