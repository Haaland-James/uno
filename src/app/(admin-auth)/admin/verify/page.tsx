"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, AlertCircle } from "lucide-react";
import { requestOtp, verifyOtpAndSignIn } from "@/lib/authClient";

function AdminVerifyForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const email = searchParams.get("email") ?? "";
	const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
	const devCode = searchParams.get("devCode");

	const [code, setCode] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [resending, setResending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [banner, setBanner] = useState<string | null>(null);

	useEffect(() => {
		if (devCode && !code) setCode(devCode);
	}, [devCode, code]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!email) {
			setError("Missing email — start over from sign in.");
			return;
		}
		setSubmitting(true);
		setError(null);

		const result = await verifyOtpAndSignIn({
			email,
			code,
			purpose: "LOGIN",
			callbackUrl,
		});

		if (!result.ok) {
			setError(result.error ?? "Verification failed");
			setSubmitting(false);
			return;
		}

		// Hard navigate so the (admin) layout runs server-side and applies role gating.
		// If the account isn't an admin, the layout bounces back to /admin/login?error=not_admin.
		window.location.assign(callbackUrl);
	}

	async function handleResend() {
		setResending(true);
		setError(null);
		setBanner(null);
		const result = await requestOtp({ email, purpose: "LOGIN" });
		if (!result.ok) {
			setError(result.error ?? "Could not resend code");
		} else {
			setBanner(
				result.devCode
					? `New code sent. (Dev: ${result.devCode})`
					: "New code sent. Check your inbox."
			);
			if (result.devCode) setCode(result.devCode);
		}
		setResending(false);
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
			<div className="w-full max-w-[400px]">
				<div className="mb-8 flex flex-col items-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-uno-red/10">
						<Lock className="h-5 w-5 text-uno-red" />
					</div>
					<h1 className="text-[24px] font-semibold leading-tight">Verify it&apos;s you</h1>
					<p className="mt-1 text-[13px] text-white/50">
						Enter the 6-digit code sent to
					</p>
					<p className="text-[13px] text-white/80">{email || "your email"}</p>
				</div>

				<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
					<input
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						placeholder="••••••"
						value={code}
						onChange={(e) =>
							setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
						}
						maxLength={6}
						disabled={submitting}
						className="h-[50px] w-full rounded-md border border-white/15 bg-white/5 px-4 text-center text-[18px] tracking-[0.4em] text-white placeholder:tracking-normal placeholder:text-white/30 focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red disabled:opacity-60"
					/>

					{error && (
						<div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">
							<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
							<span>{error}</span>
						</div>
					)}
					{banner && (
						<div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-center text-[13px] text-green-300">
							{banner}
						</div>
					)}

					<button
						type="submit"
						disabled={submitting || code.length !== 6}
						className="mt-2 h-[50px] w-full rounded-md bg-uno-red text-[15px] font-semibold text-white transition-colors hover:bg-uno-red-hover disabled:cursor-not-allowed disabled:opacity-60"
					>
						{submitting ? "Verifying…" : "Continue"}
					</button>
				</form>

				<div className="mt-5 flex items-center justify-between text-[13px]">
					<button
						type="button"
						onClick={() => router.push("/admin/login")}
						className="text-white/50 underline-offset-2 hover:text-white hover:underline"
					>
						Use a different email
					</button>
					<button
						type="button"
						onClick={handleResend}
						disabled={resending}
						className="text-uno-red underline underline-offset-2 hover:text-uno-red-hover disabled:opacity-60"
					>
						{resending ? "Sending…" : "Resend code"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default function AdminVerifyPage() {
	return (
		<Suspense>
			<AdminVerifyForm />
		</Suspense>
	);
}
