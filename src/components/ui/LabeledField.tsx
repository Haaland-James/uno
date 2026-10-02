"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { useListingErrorsStore } from "@/stores/listingErrorsStore";

interface LabeledFieldProps {
	label: string;
	htmlFor?: string;
	helper?: React.ReactNode;
	error?: string | null;
	/**
	 * Wizard field name this label belongs to. When set, the field is findable for
	 * scrolling (`data-field`) and shows the server's message for that field if the
	 * last save was refused. An explicit `error` prop wins.
	 */
	name?: string;
	required?: boolean;
	className?: string;
	children: React.ReactNode | ((props: { id: string }) => React.ReactNode);
}

export function LabeledField({
	label,
	htmlFor,
	helper,
	error: errorProp,
	name,
	required,
	className,
	children,
}: LabeledFieldProps) {
	const autoId = useId();
	const serverError = useListingErrorsStore((s) => (name ? s.errors[name] : undefined));
	const error = errorProp ?? serverError;
	const id = htmlFor ?? autoId;

	return (
		<div className={cn("flex flex-col gap-1.5", className)} data-field={name}>
			<label
				htmlFor={id}
				className="text-[13px] font-medium text-black/80"
			>
				{label}
				{required ? <span className="ml-0.5 text-[#af2525]">*</span> : null}
			</label>
			{typeof children === "function" ? children({ id }) : children}
			{error ? (
				<p role="alert" className="pl-1 text-[12px] text-[#af2525]">{error}</p>
			) : helper ? (
				<p className="pl-1 text-[12px] text-black/55">{helper}</p>
			) : null}
		</div>
	);
}

/**
 * The server's message for a field that has no label wrapper (for example the
 * photo grid). Renders nothing until that field has a message.
 */
export function FieldError({ name, className }: { name: string; className?: string }) {
	const message = useListingErrorsStore((s) => s.errors[name]);
	return (
		<div data-field={name} className={className}>
			{message ? <p role="alert" className="mt-2 pl-1 text-[12px] text-[#af2525]">{message}</p> : null}
		</div>
	);
}
