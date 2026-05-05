"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LabeledField } from "@/components/ui/LabeledField";
import { NumberInput } from "@/components/ui/NumberInput";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { FURNISHING_OPTIONS } from "@/../config/constants";

const FURNISHING_OPTS = FURNISHING_OPTIONS.map((o) => ({
	value: o.value,
	label: o.label,
}));

const CONDITION_OPTS = [
	{ value: "NEWLY_BUILT", label: "Newly Built" },
	{ value: "GOOD", label: "Good Condition" },
	{ value: "RENOVATED", label: "Recently Renovated" },
	{ value: "NEEDS_WORK", label: "Needs Some Work" },
];

const OWNERSHIP_OPTS = [
	{ value: "FREEHOLD", label: "Freehold" },
	{ value: "LEASEHOLD", label: "Leasehold" },
	{ value: "C_OF_O", label: "Certificate of Occupancy" },
	{ value: "GOVERNORS_CONSENT", label: "Governor's Consent" },
	{ value: "DEED_OF_ASSIGNMENT", label: "Deed of Assignment" },
];

const currentYear = new Date().getFullYear();

export function DescriptionStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				Please provide a detailed description of your property.
			</h1>

			<div className="flex flex-col gap-5">
				<LabeledField label="Property Size" helper="Floor area of the property">
					{({ id }) => (
						<NumberInput
							id={id}
							placeholder="e.g. 90"
							suffix="sqm"
							value={data.size}
							onChange={(v) => updateData({ size: v })}
							aria-label="Property size in square metres"
						/>
					)}
				</LabeledField>

				<LabeledField label="Year Built" helper="Optional">
					{({ id }) => (
						<NumberInput
							id={id}
							placeholder="e.g. 2018"
							min={1950}
							max={currentYear}
							value={data.yearBuilt}
							onChange={(v) => updateData({ yearBuilt: v })}
							aria-label="Year built"
						/>
					)}
				</LabeledField>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<LabeledField label="Furnishing Status">
						{({ id }) => (
							<Select
								id={id}
								value={data.furnishing || undefined}
								onValueChange={(v) => updateData({ furnishing: v })}
								options={FURNISHING_OPTS}
								placeholder="Select"
								aria-label="Furnishing Status"
							/>
						)}
					</LabeledField>
					<LabeledField label="Floor" helper="Optional">
						{({ id }) => (
							<Input
								id={id}
								placeholder="e.g. Ground, 1st"
								value={data.floorNumber}
								onChange={(e) => updateData({ floorNumber: e.target.value })}
							/>
						)}
					</LabeledField>
				</div>

				<LabeledField label="Property Condition" required>
					{({ id }) => (
						<Select
							id={id}
							value={data.condition || undefined}
							onValueChange={(v) => updateData({ condition: v })}
							options={CONDITION_OPTS}
							placeholder="Select condition"
							aria-label="Property Condition"
						/>
					)}
				</LabeledField>

				<LabeledField label="Ownership Type" required>
					{({ id }) => (
						<Select
							id={id}
							value={data.ownershipType || undefined}
							onValueChange={(v) => updateData({ ownershipType: v })}
							options={OWNERSHIP_OPTS}
							placeholder="Select ownership"
							aria-label="Ownership Type"
						/>
					)}
				</LabeledField>
			</div>
		</div>
	);
}
