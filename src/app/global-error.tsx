"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 500 }}>Something went wrong</h2>
          <button
            onClick={reset}
            style={{ borderRadius: "50px", backgroundColor: "#af2525", padding: "8px 24px", fontSize: "15px", color: "white", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
