"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import type { Gender } from "@/types";
import { cn } from "@/lib/utils";

function SaveButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="h-12 rounded-[40px] bg-[#af2525] px-10 text-[15px] font-semibold text-white transition-colors hover:bg-[#93191d] disabled:cursor-not-allowed disabled:opacity-50"
		>
			Save
		</button>
	);
}

interface NameEditorProps {
	current?: string | null;
	onSave: (name: string) => void;
	disabled?: boolean;
}

export function NameEditor({ current, onSave, disabled }: NameEditorProps) {
	const [first = "", last = ""] = (current ?? "").split(" ");
	const [firstName, setFirstName] = useState(first);
	const [lastName, setLastName] = useState(last);

	const handleSave = () => {
		const next = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
		if (next) onSave(next);
	};

	return (
		<div className="flex flex-col gap-3">
			<Input
				placeholder="First Name"
				value={firstName}
				onChange={(e) => setFirstName(e.target.value)}
			/>
			<Input
				placeholder="Last Name"
				value={lastName}
				onChange={(e) => setLastName(e.target.value)}
			/>
			<div className="flex justify-end">
				<SaveButton
					onClick={handleSave}
					disabled={disabled || (!firstName.trim() && !lastName.trim())}
				/>
			</div>
		</div>
	);
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
	{ value: "MALE", label: "Male" },
	{ value: "FEMALE", label: "Female" },
	{ value: "NON_BINARY", label: "Non-binary" },
	{ value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

interface GenderEditorProps {
	current?: Gender | null;
	onSave: (gender: Gender) => void;
	disabled?: boolean;
}

export function GenderEditor({ current, onSave, disabled }: GenderEditorProps) {
	const [selected, setSelected] = useState<Gender | null>(current ?? null);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-2">
				{GENDER_OPTIONS.map((opt) => {
					const isActive = selected === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							onClick={() => setSelected(opt.value)}
							className={cn(
								"flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left text-[15px] transition-colors",
								isActive
									? "border-[#af2525] bg-[#fff1f1] text-black"
									: "border-[rgba(186,186,186,0.65)] bg-white text-black/80 hover:bg-black/[0.02]"
							)}
						>
							<span
								className={cn(
									"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
									isActive
										? "border-[#af2525]"
										: "border-black/30"
								)}
							>
								{isActive && (
									<span className="h-2.5 w-2.5 rounded-full bg-[#af2525]" />
								)}
							</span>
							{opt.label}
						</button>
					);
				})}
			</div>
			<div className="flex justify-end">
				<SaveButton
					onClick={() => selected && onSave(selected)}
					disabled={disabled || !selected}
				/>
			</div>
		</div>
	);
}

interface SimpleEditorProps {
	current?: string | null;
	placeholder: string;
	type?: "text" | "email" | "tel";
	onSave: (value: string) => void;
	disabled?: boolean;
}

export function SimpleEditor({ current, placeholder, type = "text", onSave, disabled }: SimpleEditorProps) {
	const [value, setValue] = useState(current ?? "");

	return (
		<div className="flex flex-col gap-3">
			<Input
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
			<div className="flex justify-end">
				<SaveButton
					onClick={() => onSave(value.trim())}
					disabled={disabled || !value.trim()}
				/>
			</div>
		</div>
	);
}
