"use client";

import * as React from "react";
import * as RSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectProps {
	value?: string;
	onValueChange?: (value: string) => void;
	options: readonly SelectOption[];
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	id?: string;
	"aria-label"?: string;
}

export function Select({
	value,
	onValueChange,
	options,
	placeholder = "Select an option",
	disabled,
	className,
	id,
	...rest
}: SelectProps) {
	return (
		<RSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
			<RSelect.Trigger
				id={id}
				aria-label={rest["aria-label"]}
				className={cn(
					"inline-flex h-12 w-full items-center justify-between rounded-[40px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] font-normal text-black outline-none transition-colors data-[placeholder]:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] disabled:cursor-not-allowed disabled:opacity-50",
					className
				)}
			>
				<RSelect.Value placeholder={placeholder} />
				<RSelect.Icon>
					<ChevronDown size={18} className="text-black/60" />
				</RSelect.Icon>
			</RSelect.Trigger>

			<RSelect.Portal>
				<RSelect.Content
					position="popper"
					sideOffset={6}
					className="z-[110] max-h-[280px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-xl"
				>
					<RSelect.Viewport className="p-1">
						{options.map((opt) => (
							<RSelect.Item
								key={opt.value}
								value={opt.value}
								className="relative flex cursor-pointer select-none items-center rounded-[12px] px-3 py-2.5 pr-8 text-[15px] text-black outline-none data-[highlighted]:bg-[#fff1f1] data-[state=checked]:font-semibold"
							>
								<RSelect.ItemText>{opt.label}</RSelect.ItemText>
								<RSelect.ItemIndicator className="absolute right-3">
									<Check size={16} className="text-[#af2525]" />
								</RSelect.ItemIndicator>
							</RSelect.Item>
						))}
					</RSelect.Viewport>
				</RSelect.Content>
			</RSelect.Portal>
		</RSelect.Root>
	);
}

export default Select;
