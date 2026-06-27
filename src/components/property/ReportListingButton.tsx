"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "@/stores/toastStore";

const REASONS: { value: string; label: string }[] = [
	{ value: "SCAM", label: "Looks like a scam or fraud" },
	{ value: "INACCURATE", label: "Details are inaccurate (price, photos, location)" },
	{ value: "UNAVAILABLE", label: "Already rented / no longer available" },
	{ value: "DUPLICATE", label: "Duplicate of another listing" },
	{ value: "OFFENSIVE", label: "Offensive or inappropriate content" },
	{ value: "OTHER", label: "Something else" },
];

/**
 * Discreet "Report this listing" control for the public property page. Opens a
 * small modal; posts to /api/properties/[id]/report. Works for guests and
 * signed-in users alike.
 */
export function ReportListingButton({ propertyId }: { propertyId: string }) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [details, setDetails] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!reason) return;
		setSubmitting(true);
		try {
			const res = await fetch(`/api/properties/${propertyId}/report`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ reason, details: details.trim() || undefined }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json.error?.message ?? "Could not submit report");
			}
			toast.success("Thanks — our team will review this listing.");
			setOpen(false);
			setReason("");
			setDetails("");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not submit report");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-uno-red transition-colors"
			>
				<Flag className="h-4 w-4" />
				Report this listing
			</button>

			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
					<button
						type="button"
						aria-label="Close"
						onClick={() => setOpen(false)}
						className="absolute inset-0 bg-black/50"
					/>
					<form
						onSubmit={submit}
						className="relative z-10 w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
					>
						<div className="mb-3 flex items-start justify-between gap-2">
							<div>
								<h3 className="text-base font-semibold text-content-primary">Report this listing</h3>
								<p className="text-sm text-content-secondary">
									Tell us what&apos;s wrong. Reports are confidential.
								</p>
							</div>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="rounded-md p-1 text-content-secondary hover:bg-black/5"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="space-y-2">
							{REASONS.map((r) => (
								<label
									key={r.value}
									className="flex cursor-pointer items-start gap-2.5 rounded-md border border-black/10 p-2.5 text-sm hover:bg-black/[0.02]"
								>
									<input
										type="radio"
										name="reason"
										value={r.value}
										checked={reason === r.value}
										onChange={() => setReason(r.value)}
										className="mt-0.5 accent-uno-red"
									/>
									<span className="text-content-primary">{r.label}</span>
								</label>
							))}
						</div>

						<textarea
							value={details}
							onChange={(e) => setDetails(e.target.value)}
							maxLength={1000}
							rows={3}
							placeholder="Add any details (optional)…"
							className="mt-3 w-full resize-none rounded-md border border-black/15 px-3 py-2 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
						/>

						<div className="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-content-secondary hover:bg-black/5"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={!reason || submitting}
								className="rounded-md bg-uno-red px-4 py-2 text-sm font-semibold text-white hover:bg-uno-red-hover disabled:opacity-60"
							>
								{submitting ? "Submitting…" : "Submit report"}
							</button>
						</div>
					</form>
				</div>
			)}
		</>
	);
}
