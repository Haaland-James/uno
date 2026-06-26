"use client";

import { useState } from "react";
import { toast } from "@/stores/toastStore";

interface PasswordFormProps {
  hasPassword: boolean;
  onSuccess: () => void;
}

export function PasswordForm({ hasPassword, onSuccess }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { newPassword };
      if (hasPassword) body.currentPassword = currentPassword;

      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to save password");
      }

      toast.success(hasPassword ? "Password updated" : "Password created");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "h-[44px] w-full rounded-xl border border-black/15 bg-white px-4 text-[14px] text-black placeholder:text-black/40 focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-1">
      {hasPassword && (
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={saving}
          className={inputClass}
        />
      )}
      <input
        type="password"
        placeholder="New password (min 8 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        disabled={saving}
        className={inputClass}
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
        disabled={saving}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={saving || !newPassword || !confirmPassword}
        className="mt-1 h-[40px] rounded-xl bg-[#af2525] text-[14px] font-semibold text-white transition-colors hover:bg-[#931a1a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving
          ? "Saving…"
          : hasPassword
          ? "Update Password"
          : "Set Password"}
      </button>
    </form>
  );
}
