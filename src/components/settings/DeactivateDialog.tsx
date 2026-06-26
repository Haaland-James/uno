"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "@/stores/toastStore";

interface DeactivateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DeactivateDialog({ open, onClose }: DeactivateDialogProps) {
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  async function handleDeactivate() {
    setConfirming(true);
    try {
      const res = await fetch("/api/me/deactivate", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to deactivate");
      }

      toast.success("Account deactivated");
      signOut({ callbackUrl: "/login" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to deactivate");
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6">
        <h2 className="text-[18px] font-semibold text-black">
          Deactivate Account
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-black/60">
          This will deactivate your account and pause all your active listings.
          You will be signed out immediately.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex-1 rounded-xl border border-black/15 px-4 py-2.5 text-[14px] font-medium text-black transition-colors hover:bg-black/5 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={confirming}
            className="flex-1 rounded-xl bg-[#af2525] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#931a1a] disabled:opacity-60"
          >
            {confirming ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}
