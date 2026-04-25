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

// Of the auth-required routes, these are landlord/agent/admin-only.
// /landlord/properties/new is intentionally NOT here — the listing wizard
// handles the renter→landlord upgrade flow itself, so any authenticated user
// can enter (just /landlord/properties/new specifically).
const landlordRoutes = [
	"/landlord",
];

// Paths under /landlord that any authenticated user (renter included) can hit
// — typically the wizard for becoming a lister.
const LANDLORD_OPEN_PATHS = ["/landlord/properties/new"];

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

	const isLandlordRoute =
		landlordRoutes.some(
			(route) => pathname === route || pathname.startsWith(`${route}/`)
		) && !LANDLORD_OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

	// Logged-in users should not see /login or /signup
	if (token && authOnlyForGuests.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
		return NextResponse.redirect(new URL("/feed", request.url));
	}

	// Anything not public requires auth
	if (!publicPath && !token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Landlord-only routes require LANDLORD/AGENT/ADMIN role
	if (
		isLandlordRoute &&
		token &&
		token.role !== "LANDLORD" &&
		token.role !== "AGENT" &&
		token.role !== "ADMIN"
	) {
		return NextResponse.redirect(new URL("/feed", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		// Match everything except static files, API, and Next internals
		"/((?!_next/static|_next/image|favicon.ico|public|api).*)",
	],
};
