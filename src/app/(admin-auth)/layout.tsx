/**
 * Public route group for admin authentication surfaces (/admin/login, /admin/verify).
 * Intentionally lightweight: NO session check here so admins can sign in.
 * Bouncing of already-signed-in admins is handled in middleware.
 */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-[#0f1112] text-white">
			{children}
		</div>
	);
}
