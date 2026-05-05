"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LabeledField } from "@/components/ui/LabeledField";
import { NumberInput } from "@/components/ui/NumberInput";
import { useListPropertyStore } from "@/stores/listPropertyStore";

const ROOM_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
	value: String(n),
	label: n === 0 ? "Studio" : `${n}`,
}));

const FIT_OUT_OPTS = [
	{ value: "SHELL", label: "Shell (bare)" },
	{ value: "FITTED", label: "Fitted (finished)" },
	{ value: "FURNISHED", label: "Furnished (move-in ready)" },
];

export function PropertyInfoStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	const isCommercial = data.propertyKind === "COMMERCIAL";

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				{isCommercial ? "Tell us about the space" : "Tell us the basics about your property"}
			</h1>
			<div className="flex flex-col gap-5">
				<LabeledField
					label="Property Title"
					required
					helper={`${data.title.length}/100 characters`}
				>
					{({ id }) => (
						<Input
							id={id}
							placeholder={
								isCommercial
									? "e.g. Modern Office Suite at Victoria Island"
									: "e.g. Spacious 2 Bedroom Flat in Lekki"
							}
							maxLength={100}
							value={data.title}
							onChange={(e) => updateData({ title: e.target.value })}
						/>
					)}
				</LabeledField>

				{isCommercial ? (
					<>
						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
							<LabeledField label="Floor Area" required helper="In square metres">
								{({ id }) => (
									<NumberInput
										id={id}
										placeholder="e.g. 120"
										suffix="sqm"
										value={data.floorAreaSqm}
										onChange={(v) => updateData({ floorAreaSqm: v })}
										aria-label="Floor area in square metres"
									/>
								)}
							</LabeledField>
							<LabeledField label="Floor Level" helper="e.g. Ground, 3rd, Mezzanine">
								{({ id }) => (
									<Input
										id={id}
										placeholder="e.g. 3rd Floor"
										value={data.floorLevel}
										onChange={(e) => updateData({ floorLevel: e.target.value })}
									/>
								)}
							</LabeledField>
						</div>
						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
							<LabeledField label="Number of Units" helper="If multiple rooms / shops">
								{({ id }) => (
									<NumberInput
										id={id}
										placeholder="e.g. 4"
										value={data.units}
										onChange={(v) => updateData({ units: v })}
										aria-label="Number of units"
									/>
								)}
							</LabeledField>
							<LabeledField label="Fit-out State" required>
								{({ id }) => (
									<Select
										id={id}
										value={data.fitOutState || undefined}
										onValueChange={(v) => updateData({ fitOutState: v })}
										options={FIT_OUT_OPTS}
										placeholder="Select"
										aria-label="Fit-out State"
									/>
								)}
							</LabeledField>
						</div>
					</>
				) : (
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<LabeledField label="No. of Bedrooms" required>
							{({ id }) => (
								<Select
									id={id}
									value={data.bedrooms !== null ? String(data.bedrooms) : undefined}
									onValueChange={(v) => updateData({ bedrooms: Number(v) })}
									options={ROOM_OPTIONS}
									placeholder="Select"
									aria-label="No. of Bedrooms"
								/>
							)}
						</LabeledField>
						<LabeledField label="No. of Bathrooms" required>
							{({ id }) => (
								<Select
									id={id}
									value={data.bathrooms !== null ? String(data.bathrooms) : undefined}
									onValueChange={(v) => updateData({ bathrooms: Number(v) })}
									options={ROOM_OPTIONS}
									placeholder="Select"
									aria-label="No. of Bathrooms"
								/>
							)}
						</LabeledField>
					</div>
				)}

				<LabeledField label="Brief Description" helper="Optional — a sentence or two">
					{({ id }) => (
						<Textarea
							id={id}
							placeholder="What makes this property stand out?"
							maxChars={1100}
							showCounter
							value={data.briefDescription}
							onChange={(e) => updateData({ briefDescription: e.target.value })}
						/>
					)}
				</LabeledField>
			</div>
		</div>
	);
}
