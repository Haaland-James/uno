"use client";

import { cn } from "@/lib/utils";
import { InputField } from "@/components/shared/InputField";

interface FormWithLabelProps {
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDropdownIcon?: boolean;
  type?: string;
  className?: string;
  name?: string;
  id?: string;
}

export function FormWithLabel({
  label,
  showLabel = true,
  placeholder,
  value,
  onChange,
  showDropdownIcon = false,
  type = "text",
  className,
  name,
  id,
}: FormWithLabelProps) {
  return (
    <div className={cn("flex flex-col gap-[15px] w-full", className)}>
      {showLabel && label && (
        <label
          htmlFor={id}
          className="text-[16px] text-[rgba(0,0,0,0.8)] font-normal font-sans"
        >
          {label}
        </label>
      )}
      <InputField
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        showDropdownIcon={showDropdownIcon}
      />
    </div>
  );
}
