"use client";

import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedCardProps {
  id: string;
  name: string;
  searchType: string;
  isActive: boolean;
  notificationsOn: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function SavedCard({
  id,
  name,
  searchType,
  isActive,
  notificationsOn,
  onEdit,
  onDelete,
  className,
}: SavedCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between h-[228px] w-[384px] bg-[#fafafa] border border-[rgba(0,0,0,0.1)] rounded-[18px] p-[20px]",
        "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {/* Top section */}
      <div className="flex flex-col gap-[6px]">
        <h3 className="font-semibold text-[20px] text-[#161515] leading-tight line-clamp-2">
          {name}
        </h3>
        <p className="font-light text-[16px] text-[#161515]">{searchType}</p>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {/* Left: Active + Notifications */}
        <div className="flex flex-col gap-[4px]">
          <div className="flex items-center gap-[4px]">
            <CheckCircle2
              size={14}
              className={cn(
                isActive ? "text-green-600" : "text-[rgba(10,10,10,0.4)]"
              )}
            />
            <span className="text-[12px] text-[rgba(10,10,10,0.78)]">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <span className="text-[12px] text-[rgba(10,10,10,0.78)]">
            Notifications:{" "}
            <span className="font-bold">{notificationsOn ? "ON" : "OFF"}</span>
          </span>
        </div>

        {/* Right: Edit + Delete */}
        <div className="flex items-center gap-[16px]">
          <button
            onClick={() => onEdit?.(id)}
            className="flex items-center gap-[4px] text-[12px] text-[rgba(10,10,10,0.78)] hover:text-[#161515] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] rounded"
            aria-label={`Edit saved search: ${name}`}
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete?.(id)}
            className="flex items-center gap-[4px] text-[12px] text-[rgba(10,10,10,0.78)] hover:text-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
            aria-label={`Delete saved search: ${name}`}
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavedCard;
