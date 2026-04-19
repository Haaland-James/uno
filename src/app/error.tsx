"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-[20px] font-medium text-[#161515]">Something went wrong</h2>
      <button
        onClick={reset}
        className="rounded-full bg-[#af2525] px-6 py-2 text-[15px] text-white transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
