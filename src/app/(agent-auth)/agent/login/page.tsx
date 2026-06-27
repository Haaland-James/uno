"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, AlertCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { requestOtp } from "@/lib/authClient";

function AgentLoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? "/agent";
	const needsSignout = searchParams.get("signout") === "1";

	// Middleware detected a non-agent session on an agent auth route and
	// redirected here with ?signout=1. Clear it now so the browser cookie
	// is gone before the user enters their agent email.
	useEffect(() => {
		if (needsSignout) {
			signOut({ redirect: false }).then(() => {
				setSigningOut(false);
				// Remove the signout param so a refresh doesn't loop
				const params = new URLSearchParams(searchParams.toString());
				params.delete("signout");
				const qs = params.toString();
				router.replace(`/agent/login${qs ? `?${qs}` : ""}`);
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const errorParam = searchParams.get("error");

	const [signingOut, setSigningOut] = useState(needsSignout);
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(
		errorParam === "not_agent"
			? "That account isn't a UNO agent. Sign in with your staff account."
			: null
	);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		const result = await requestOtp({ email, purpose: "LOGIN", agentOnly: true });
		if (!result.ok) {
			setError(result.error ?? "Could not send code");
			setSubmitting(false);
			return;
		}

		const params = new URLSearchParams({ email, mode: "LOGIN", callbackUrl });
		if (result.devCode) params.set("devCode", result.devCode);
		router.push(`/agent/verify?${params.toString()}`);
	}

	if (signingOut) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-white/40">Signing out…</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
			<div className="w-full max-w-[400px]">
				<div className="mb-8 flex flex-col items-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-uno-red/10">
						<Briefcase className="h-5 w-5 text-uno-red" />
					</div>
					<h1 className="text-[28px] font-semibold leading-tight md:text-[32px]">
						UNO <span className="text-uno-red">Agents</span>
					</h1>
					<p className="mt-1 text-[13px] text-white/50">
						Field operations console — authorised staff only
					</p>
				</div>

				<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
					<label className="text-[12px] uppercase tracking-wide text-white/50">
						Agent email
					</label>
					<input
						type="email"
						required
						autoComplete="email"
						placeholder="you@uno.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={submitting}
						className="h-[50px] w-full rounded-md border border-white/15 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/30 focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red disabled:opacity-60"
					/>

					{error && (
						<div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">
							<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
							<span>{error}</span>
						</div>
					)}

					<button
						type="submit"
						disabled={submitting || !email}
						className="mt-2 h-[50px] w-full rounded-md bg-uno-red text-[15px] font-semibold text-white transition-colors hover:bg-uno-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uno-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1112] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{submitting ? "Sending code…" : "Continue"}
					</button>
				</form>

				<p className="mt-8 text-center text-[11px] uppercase tracking-wider text-white/30">
					Sign-ins are audited
				</p>
			</div>
		</div>
	);
}

export default function AgentLoginPage() {
	return (
		<Suspense>
			<AgentLoginForm />
		</Suspense>
	);
}
