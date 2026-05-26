import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);
	// Not signed in → admin login (middleware also enforces this; layout is defence-in-depth)
	if (!session?.user?.id) redirect("/admin/login?callbackUrl=/admin");
	// Signed in but wrong role → bounce to admin login with an explicit error.
	// Renters/landlords should know they used the wrong account, not be silently
	// sent to /feed which would look like a broken click.
	if (session.user.role !== "ADMIN") redirect("/admin/login?error=not_admin");

	return <AdminShell email={session.user.email}>{children}</AdminShell>;
}
