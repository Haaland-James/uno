"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { logoHref } from "@/lib/logo-href";

/**
 * The link around the header logo, one rule for every header: signed in → /feed,
 * guest → /. Wraps the logo markup the header already has, so the look is untouched.
 */
export function LogoLink({ className = "flex items-center", children }: { className?: string; children: React.ReactNode }) {
	const { status } = useSession();
	return (
		<Link href={logoHref(status === "authenticated")} className={className}>
			{children}
		</Link>
	);
}
