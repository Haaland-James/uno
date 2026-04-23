"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	function Input({ className, type = "text", ...props }, ref) {
		return (
			<input
				ref={ref}
				type={type}
				className={cn(
					"h-12 w-full rounded-[40px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] font-normal text-black outline-none transition-colors placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525]",
					className
				)}
				{...props}
			/>
		);
	}
);
