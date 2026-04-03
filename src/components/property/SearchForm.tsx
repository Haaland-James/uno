"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
}

export function SearchForm({
  placeholder = "Search by location, property type...",
  value,
  onChange,
  onSubmit,
  className,
}: SearchFormProps) {
  const [internalValue, setInternalValue] = useState("");
  const [focused, setFocused] = useState(false);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit?.(currentValue);
    }
  };

  const handleIconClick = () => {
    onSubmit?.(currentValue);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-[12px] h-[48px] px-[14px] w-full rounded-[40px]",
        "border transition-colors",
        focused
          ? "border-[#af2525]"
          : "border-[rgba(186,186,186,0.65)]",
        className
      )}
    >
      <button
        type="button"
        onClick={handleIconClick}
        className="flex-shrink-0 w-[25px] h-[25px] rounded-full bg-[#af2525] flex items-center justify-center"
        aria-label="Search"
      >
        <Search size={14} color="white" strokeWidth={2.5} />
      </button>
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none border-none",
          "text-[16px] text-[rgba(10,10,10,0.85)] font-normal font-sans",
          "placeholder:text-[rgba(10,10,10,0.4)] placeholder:text-[16px]"
        )}
      />
    </div>
  );
}
