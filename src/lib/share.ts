"use client";

interface ShareInput {
  title: string;
  text?: string;
  url: string;
}

type ShareResult =
  | { kind: "shared" }
  | { kind: "copied" }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

/**
 * Share a URL using the native Web Share API where available,
 * falling back to clipboard copy. Returns the outcome so callers can
 * display an appropriate toast.
 */
export async function shareOrCopy(input: ShareInput): Promise<ShareResult> {
  // Web Share API (mobile + most modern browsers)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: input.title, text: input.text, url: input.url });
      return { kind: "shared" };
    } catch (e) {
      // User cancelled the share sheet
      if (e instanceof Error && e.name === "AbortError") {
        return { kind: "cancelled" };
      }
      // Fall through to clipboard
    }
  }

  // Clipboard fallback
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(input.url);
    } else {
      // Old-school fallback for very old browsers
      const ta = document.createElement("textarea");
      ta.value = input.url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    return { kind: "copied" };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : "Could not share" };
  }
}
