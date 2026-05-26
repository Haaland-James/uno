"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, AlertCircle } from "lucide-react";
import { requestOtp } from "@/lib/authClient";

function AdminLoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
	const errorParam = searchParams.get("error");

	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(
		errorParam === "not_admin"
			? "That account isn't an administrator. Sign in with an admin account."
			: null
	);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		const result = await requestOtp({ email, purpose: "LOGIN" });
		if (!result.ok) {
			setError(result.error ?? "Could not send code");
			setSubmitting(false);
			return;
		}

		const params = new URLSearchParams({ email, mode: "LOGIN", callbackUrl });
		if (result.devCode) params.set("devCode", result.devCode);
		router.push(`/admin/verify?${params.toString()}`);
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
			<div className="w-full max-w-[400px]">
				<div className="mb-8 flex flex-col items-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-uno-red/10">
						<Lock className="h-5 w-5 text-uno-red" />
					</div>
					<h1 className="text-[28px] font-semibold leading-tight md:text-[32px]">
						UNO <span className="text-uno-red">Admin</span>
					</h1>
					<p className="mt-1 text-[13px] text-white/50">
						Internal console — authorised staff only
					</p>
				</div>

				<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
					<label className="text-[12px] uppercase tracking-wide text-white/50">
						Admin email
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

export default function AdminLoginPage() {
	return (
		<Suspense>
			<AdminLoginForm />
		</Suspense>
	);
}
