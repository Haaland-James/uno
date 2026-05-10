import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login?next=/admin/listings");
	if (session.user.role !== "ADMIN") redirect("/");

	return (
		<>
			<Header />
			<main className="min-h-[calc(100vh-4rem)] bg-[#fbfbfb]">{children}</main>
		</>
	);
}
