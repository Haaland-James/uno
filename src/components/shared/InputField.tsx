"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDropdownIcon?: boolean;
  onDropdownClick?: () => void;
  type?: string;
  className?: string;
  name?: string;
  id?: string;
}

export function InputField({
  placeholder,
  value,
  onChange,
  showDropdownIcon = false,
  onDropdownClick,
  type = "text",
  className,
  name,
  id,
}: InputFieldProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-[48px] px-[23px] py-[13px] rounded-[40px]",
          "border border-[rgba(186,186,186,0.65)]",
          "text-[16px] text-[rgba(10,10,10,0.4)] font-normal font-sans",
          "placeholder:text-[rgba(10,10,10,0.4)] placeholder:text-[16px] placeholder:font-normal",
          "focus:border-[#af2525] focus:outline-none",
          "bg-transparent transition-colors",
          showDropdownIcon && "pr-[52px]"
        )}
      />
      {showDropdownIcon && (
        <button
          type="button"
          onClick={onDropdownClick}
          className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[rgba(10,10,10,0.4)] hover:text-[rgba(10,10,10,0.7)] transition-colors"
          tabIndex={-1}
        >
          <ChevronDown size={24} />
        </button>
      )}
    </div>
  );
}
