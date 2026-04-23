"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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

			<div className="flex flex-col gap-4">
				<Input
					type="number"
					placeholder="Property Size e.g. 90 sqm (optional)"
					value={data.size ?? ""}
					onChange={(e) =>
						updateData({ size: e.target.value ? Number(e.target.value) : null })
					}
				/>

				<Input
					type="number"
					placeholder="Year Built (optional)"
					min={1950}
					max={currentYear}
					value={data.yearBuilt ?? ""}
					onChange={(e) =>
						updateData({
							yearBuilt: e.target.value ? Number(e.target.value) : null,
						})
					}
				/>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Select
						value={data.furnishing || undefined}
						onValueChange={(v) => updateData({ furnishing: v })}
						options={FURNISHING_OPTS}
						placeholder="Furnishing Status"
						aria-label="Furnishing Status"
					/>
					<Input
						placeholder="Floor e.g. Ground, 1st (optional)"
						value={data.floorNumber}
						onChange={(e) => updateData({ floorNumber: e.target.value })}
					/>
				</div>

				<Select
					value={data.condition || undefined}
					onValueChange={(v) => updateData({ condition: v })}
					options={CONDITION_OPTS}
					placeholder="Property Condition"
					aria-label="Property Condition"
				/>

				<Select
					value={data.ownershipType || undefined}
					onValueChange={(v) => updateData({ ownershipType: v })}
					options={OWNERSHIP_OPTS}
					placeholder="Ownership Type"
					aria-label="Ownership Type"
				/>
			</div>
		</div>
	);
}
