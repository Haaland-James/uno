"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "mobile" | "mobile-inactive" | "with-icon" | "mobile-with-icon";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function buttonVariants(
  props?: { variant?: ButtonProps["variant"]; className?: string }
): string {
  const { variant = "default", className } = props ?? {};

  const base =
    "inline-flex items-center justify-center font-sans font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:pointer-events-none select-none cursor-pointer";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default:
      "bg-[#af2525] text-white rounded-[50px] h-[41px] px-[30px] min-w-[133px] text-[15px] tracking-[-0.3px] hover:bg-[#93191d]",
    mobile:
      "bg-[#af2525] text-white rounded-[50px] h-[31px] px-[30px] min-w-[96px] text-[14px] font-bold tracking-[-0.28px] hover:bg-[#93191d]",
    "mobile-inactive":
      "bg-[rgba(175,37,37,0.5)] text-white rounded-[50px] h-[31px] px-[30px] min-w-[96px] text-[14px] font-bold tracking-[-0.28px] hover:opacity-90",
    "with-icon":
      "bg-[#af2525] text-white rounded-[50px] h-[41px] px-[30px] min-w-[133px] text-[15px] tracking-[-0.3px] hover:bg-[#93191d] gap-[8px]",
    "mobile-with-icon":
      "bg-[#af2525] text-white rounded-[50px] h-[31px] px-[30px] min-w-[96px] text-[14px] font-bold tracking-[-0.28px] hover:bg-[#93191d] gap-[6px]",
  };

  return cn(base, variants[variant], className);
}

export function Button({
  variant = "default",
  leftIcon,
  rightIcon,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const resolvedVariant =
    disabled && (variant === "mobile" || variant === "default")
      ? ("mobile-inactive" as ButtonProps["variant"])
      : variant;

  const classes = buttonVariants({ variant: resolvedVariant, className });

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      {
        className: cn(
          classes,
          (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>)
            .props.className
        ),
      }
    );
  }

  const showLeftIcon =
    leftIcon ||
    (variant === "with-icon" && (
      <span className="inline-flex items-center justify-center w-[27px] h-[27px] rounded-full bg-[#fff1f1] shrink-0">
        {leftIcon}
      </span>
    ));

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {variant === "with-icon" && leftIcon && (
        <span className="inline-flex items-center justify-center w-[27px] h-[27px] rounded-full bg-[#fff1f1] shrink-0">
          {leftIcon}
        </span>
      )}
      {variant !== "with-icon" && leftIcon && leftIcon}
      {children}
      {rightIcon && rightIcon}
    </button>
  );
}
