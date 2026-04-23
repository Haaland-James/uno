"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  showClose?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  className,
  ariaLabel,
  showClose = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={cn(
          "relative bg-white rounded-[18px] shadow-xl w-full max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-[#161515] hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] rounded p-1"
          >
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
