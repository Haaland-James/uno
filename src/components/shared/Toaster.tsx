"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import { cn } from "@/lib/utils";

const ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const STYLE = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-black/10 bg-white text-black",
} as const;

const ICON_COLOR = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-black/60",
} as const;

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[300] flex w-full max-w-[420px] -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6">
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-[12px] border px-4 py-3 shadow-lg backdrop-blur-sm",
              STYLE[t.kind]
            )}
          >
            <Icon size={18} className={cn("mt-0.5 flex-shrink-0", ICON_COLOR[t.kind])} />
            <p className="flex-1 text-[14px] leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-black/40 transition-colors hover:text-black/80"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
