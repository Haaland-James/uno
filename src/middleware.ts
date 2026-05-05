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
	"/coverage",      // public coverage page (when added)
	"/login",
	"/signup",
	"/verify",
	"/terms",
	"/privacy",
];

// Pages that should bounce logged-in users straight to their feed
const authOnlyForGuests = ["/login", "/signup"];

function isPublic(pathname: string): boolean {
	return publicRoutes.some(
		(route) =>
			pathname === route ||
			(route !== "/" && pathname.startsWith(`${route}/`))
	);
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
