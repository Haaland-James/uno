"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, X, Loader2, Check } from "lucide-react";
import { savedSearchesClient } from "@/lib/clients/savedSearches";
import type { SavedSearchCriteria } from "@/lib/validators/saved-search";
import { toast } from "@/stores/toastStore";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  criteria: SavedSearchCriteria;
  /** Anchor — popover positions absolute relative to its parent */
  className?: string;
}

export function SaveSearchPopover({ open, onClose, defaultName, criteria, className }: Props) {
  const [name, setName] = useState(defaultName);
  const [notifyPush, setNotifyPush] = useState(true);   // in-app / push
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(defaultName);
    setDone(false);
    setError(null);
  }, [defaultName, open]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      await savedSearchesClient.create({
        name: name.trim() || defaultName,
        criteria,
        notifyInstant: notifyPush,
        notifyEmail,
      });
      setDone(true);
      toast.success("Search saved");
      setTimeout(onClose, 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save";
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Mobile only: dim backdrop so the centered sheet reads well over the page */}
      <div
        className="md:hidden fixed inset-0 z-[200] bg-black/40"
        onClick={onClose}
        aria-hidden
      />
    <div
      ref={ref}
      className={cn(
        // Desktop: anchored absolute popover (positioned by the passed className)
        "hidden md:block absolute z-50 w-[320px] rounded-[14px] border border-black/10 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        className,
        // Mobile: full-width fixed centered sheet — escapes any overflow:hidden ancestor
        "max-md:!fixed max-md:!left-3 max-md:!right-3 max-md:!top-1/2 max-md:!w-auto max-md:!-translate-y-1/2 max-md:!z-[201] max-md:!block max-md:!max-w-[400px] max-md:!mx-auto"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-[#af2525]" />
          <span className="text-[15px] font-semibold text-[#161515]">Save this search</span>
        </div>
        <button onClick={onClose} className="text-black/40 hover:text-black" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {done ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-3 text-[14px] text-green-800">
          <Check size={16} /> Saved!
        </div>
      ) : (
        <>
          <label className="mb-1 block text-[12px] font-medium text-black/60">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            maxLength={80}
            className="mb-3 h-[40px] w-full rounded-[10px] border border-black/15 px-3 text-[14px] outline-none focus:border-[#af2525] focus:ring-1 focus:ring-[#af2525] disabled:opacity-60"
          />

          <div className="mb-1 text-[12px] font-medium text-black/60">Notify me via</div>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[#161515]">
              <input
                type="checkbox"
                checked={notifyPush}
                onChange={(e) => setNotifyPush(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 accent-[#af2525]"
              />
              Push notifications (in-app)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[#161515]">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 accent-[#af2525]"
              />
              Email
            </label>
          </div>

          {error && (
            <p className="mt-2 text-[13px] text-[#af2525]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full px-4 py-2 text-[14px] text-black/60 hover:bg-black/5 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || !name.trim()}
              className="flex items-center gap-2 rounded-full bg-[#af2525] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#93191d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
    </>
  );
}
