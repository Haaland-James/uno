"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface LabeledFieldProps {
	label: string;
	htmlFor?: string;
	helper?: React.ReactNode;
	error?: string | null;
	required?: boolean;
	className?: string;
	children: React.ReactNode | ((props: { id: string }) => React.ReactNode);
}

export function LabeledField({
	label,
	htmlFor,
	helper,
	error,
	required,
	className,
	children,
}: LabeledFieldProps) {
	const autoId = useId();
	const id = htmlFor ?? autoId;

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<label
				htmlFor={id}
				className="text-[13px] font-medium text-black/80"
			>
				{label}
				{required ? <span className="ml-0.5 text-[#af2525]">*</span> : null}
			</label>
			{typeof children === "function" ? children({ id }) : children}
			{error ? (
				<p className="pl-1 text-[12px] text-[#af2525]">{error}</p>
			) : helper ? (
				<p className="pl-1 text-[12px] text-black/55">{helper}</p>
			) : null}
		</div>
	);
}
