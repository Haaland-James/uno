import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
	"/dashboard",
	"/properties",
	"/contacts",
	"/analytics",
	"/favourites",
	"/saved-searches",
	"/profile",
	"/settings",
];

// Routes that only landlords/agents can access
const landlordRoutes = [
	"/dashboard",
	"/properties",
	"/contacts",
	"/analytics",
];

// Routes that should redirect logged-in users away
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// TODO: Replace with real auth token check
	// For now, this is a scaffold — all routes are accessible
	// When auth is implemented, uncomment the logic below:

	/*
	const token = request.cookies.get("uno-auth-token")?.value;
	const userRole = request.cookies.get("uno-user-role")?.value;

	// Check if route requires authentication
	const isProtected = protectedRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`)
	);

	const isLandlordRoute = landlordRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`)
	);

	const isAuthRoute = authRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`)
	);

	// Redirect unauthenticated users to login
	if (isProtected && !token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Redirect non-landlords away from landlord routes
	if (isLandlordRoute && userRole !== "LANDLORD" && userRole !== "ADMIN") {
		return NextResponse.redirect(new URL("/feed", request.url));
	}

	// Redirect logged-in users away from auth pages
	if (isAuthRoute && token) {
		return NextResponse.redirect(new URL("/feed", request.url));
	}
	*/

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 * - api routes
		 */
		"/((?!_next/static|_next/image|favicon.ico|public|api).*)",
	],
};
