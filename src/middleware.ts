import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public surfaces (guest-accessible). Everything ELSE under the matcher requires auth.
// Guests can: visit landing, search, view property details, sign in/up, verify.
const publicRoutes = [
	"/",
	"/search",        // legacy alias — redirects to /properties
	"/properties",    // primary search/browse hub (state-first hierarchy)
	"/property",      // /property/[id]
	"/agents",        // /agents/[slug] — public agent profile pages
	                  // (plural to avoid collision with the gated /agent/* staff console)
	"/coverage",      // public coverage page (when added)
	"/login",
	"/signup",
	"/verify",
	"/terms",
	"/privacy",
	// Admin auth surfaces. Note: order matters relative to the /admin role
	// check below — /admin/login and /admin/verify must be reachable to non-admins.
	"/admin/login",
	"/admin/verify",
	// Agent staff auth surfaces. Same pattern as admin: reachable without
	// a session so agents can sign in. Role gating happens below.
	"/agent/login",
	"/agent/verify",
];

// Pages that should bounce logged-in users straight to their feed
const authOnlyForGuests = ["/login", "/signup"];

// Admin sign-in surfaces. Treated specially: signed-in users should not see them.
// ADMINs go to /admin; everyone else goes to /feed.
const adminAuthRoutes = ["/admin/login", "/admin/verify"];

// Agent staff sign-in surfaces. Same treatment as admin — signed-in users
// should not see them. Verified agents (or admins) go to /agent; everyone
// else goes to /feed.
const agentAuthRoutes = ["/agent/login", "/agent/verify"];

function isPublic(pathname: string): boolean {
	return publicRoutes.some(
		(route) =>
			pathname === route ||
			(route !== "/" && pathname.startsWith(`${route}/`))
	);
}

function isAdminAuthRoute(pathname: string): boolean {
	return adminAuthRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function isAgentAuthRoute(pathname: string): boolean {
	return agentAuthRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const token = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET,
	});

	const publicPath = isPublic(pathname);

	// Logged-in users should not see /login or /signup
	if (token && authOnlyForGuests.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
		return NextResponse.redirect(new URL("/feed", request.url));
	}

	// Logged-in users shouldn't sit on the admin sign-in pages either.
	// ADMIN → /admin, anyone else → /feed (they don't belong in the admin flow).
	if (token && isAdminAuthRoute(pathname)) {
		const dest = token.role === "ADMIN" ? "/admin" : "/feed";
		return NextResponse.redirect(new URL(dest, request.url));
	}

	// Same treatment for agent staff sign-in pages. Verified agents and
	// admins (admins can act on agent surfaces for support) go to /agent;
	// regular consumer users go to /feed — they signed in to the wrong portal.
	if (token && isAgentAuthRoute(pathname)) {
		const isAgent =
			token.role === "ADMIN" ||
			(token.agentStatus === "VERIFIED" && token.agentEmployment === "IN_HOUSE");
		const dest = isAgent ? "/agent" : "/feed";
		return NextResponse.redirect(new URL(dest, request.url));
	}

	// Admin route gate (defence-in-depth alongside (admin)/layout.tsx). Any
	// /admin/* path other than the auth surfaces requires an ADMIN token; everyone
	// else is bounced to /admin/login. This stops non-admins from ever reaching
	// the gated layout and being silently redirected to /, which would look broken.
	if (pathname.startsWith("/admin") && !isAdminAuthRoute(pathname)) {
		if (!token) {
			const loginUrl = new URL("/admin/login", request.url);
			loginUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(loginUrl);
		}
		if (token.role !== "ADMIN") {
			const loginUrl = new URL("/admin/login", request.url);
			loginUrl.searchParams.set("error", "not_admin");
			return NextResponse.redirect(loginUrl);
		}
		return NextResponse.next();
	}

	// Agent staff route gate. Mirrors the admin pattern. Admins also pass
	// so they can troubleshoot the agent console without switching accounts.
	// Note: this gates the staff CONSOLE only. Public agent profile pages
	// live at /agent/[slug] but are served from the (renter) group at a
	// different route — they don't hit this branch.
	if (pathname.startsWith("/agent") && !isAgentAuthRoute(pathname)) {
		if (!token) {
			const loginUrl = new URL("/agent/login", request.url);
			loginUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(loginUrl);
		}
		const isInHouseAgent =
			token.agentStatus === "VERIFIED" && token.agentEmployment === "IN_HOUSE";
		if (token.role !== "ADMIN" && !isInHouseAgent) {
			const loginUrl = new URL("/agent/login", request.url);
			loginUrl.searchParams.set("error", "not_agent");
			return NextResponse.redirect(loginUrl);
		}
		return NextResponse.next();
	}

	// Anything not public requires auth. /listing/* is auth-only — any signed-in user
	// can list a property; ownership is enforced server-side per resource.
	if (!publicPath && !token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		// Match everything except static files, API, and Next internals
		"/((?!_next/static|_next/image|favicon.ico|public|api).*)",
	],
};
