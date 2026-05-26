import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

/**
 * Top-level chrome for every authenticated admin page. Two-column on desktop
 * (sidebar + content), single column with a top header + drawer on mobile.
 *
 * This shell intentionally does NOT include the public Header/Sidebar/MobileNav
 * — the admin surface is fully separate from the renter/landlord app.
 */
export function AdminShell({
	email,
	children,
}: {
	email?: string | null;
	children: ReactNode;
}) {
	return (
		<div className="md:grid md:grid-cols-[240px_1fr] min-h-screen bg-[#fbfbfb]">
			<AdminSidebar email={email} />
			<div className="flex min-w-0 flex-col">
				<AdminHeader email={email} />
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}
