"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	maxChars?: number;
	showCounter?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	function Textarea(
		{ className, maxChars, showCounter, value, defaultValue, ...props },
		ref
	) {
		const currentLength =
			typeof value === "string"
				? value.length
				: typeof defaultValue === "string"
					? defaultValue.length
					: 0;

		return (
			<div className="relative w-full">
				<textarea
					ref={ref}
					value={value}
					defaultValue={defaultValue}
					maxLength={maxChars}
					className={cn(
						"min-h-[120px] w-full rounded-[24px] border border-[rgba(186,186,186,0.65)] bg-white px-5 py-4 text-[15px] font-normal text-black outline-none transition-colors placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] resize-y",
						className
					)}
					{...props}
				/>
				{showCounter && maxChars ? (
					<div className="mt-1 pr-2 text-right text-[12px] text-black/50">
						{currentLength}/{maxChars} characters
					</div>
				) : null}
			</div>
		);
	}
);
