"use client";

/**
 * Error boundary for the public agent profile page. Renders any runtime
 * error inline so we can see it in the browser instead of just a generic
 * 500. Remove once the page is stable.
 */
export default function AgentProfileError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="mx-auto w-full max-w-[800px] px-4 py-10">
			<div className="rounded-[15px] border border-red-200 bg-red-50 p-6">
				<h1 className="text-lg font-semibold text-red-800">
					Agent profile crashed
				</h1>
				<p className="mt-2 text-sm text-red-700">
					{error.message || "Unknown error"}
				</p>
				{error.digest && (
					<p className="mt-1 text-xs text-red-600">digest: {error.digest}</p>
				)}
				{error.stack && (
					<pre className="mt-3 max-h-[400px] overflow-auto whitespace-pre-wrap rounded bg-white/60 p-3 text-[11px] text-red-900">
						{error.stack}
					</pre>
				)}
				<button
					onClick={reset}
					className="mt-4 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
				>
					Try again
				</button>
			</div>
		</div>
	);
}
