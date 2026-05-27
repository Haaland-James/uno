"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the full error to the browser console so devs can copy/paste it.
    // The generic "Something went wrong" is for users; this is for debugging.
    console.error("[root error.tsx]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="mx-auto flex min-h-[400px] w-full max-w-[800px] flex-col items-center justify-center gap-4 px-4 py-10">
      <h2 className="text-[20px] font-medium text-[#161515]">Something went wrong</h2>
      {isDev && (
        <div className="w-full rounded-md border border-red-200 bg-red-50 p-4 text-left">
          <p className="font-mono text-[13px] text-red-800">
            {error.message || "Unknown error"}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-[11px] text-red-600">
              digest: {error.digest}
            </p>
          )}
          {error.stack && (
            <pre className="mt-3 max-h-[400px] overflow-auto whitespace-pre-wrap font-mono text-[11px] text-red-900">
              {error.stack}
            </pre>
          )}
        </div>
      )}
      <button
        onClick={reset}
        className="rounded-full bg-[#af2525] px-6 py-2 text-[15px] text-white transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
