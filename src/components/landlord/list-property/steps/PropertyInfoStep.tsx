"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { PROPERTY_TYPES } from "@/../config/constants";

const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES.map((p) => ({
	value: p.value,
	label: p.label,
}));

const ROOM_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
	value: String(n),
	label: n === 0 ? "Studio" : `${n}`,
}));

export function PropertyInfoStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				Tell us the basics about your property
			</h1>
			<div className="flex flex-col gap-4">
				<div>
					<Input
						placeholder="Property Title e.g. Spacious 2 Bedroom Flat"
						maxLength={100}
						value={data.title}
						onChange={(e) => updateData({ title: e.target.value })}
					/>
					<div className="mt-1 pr-2 text-right text-[12px] text-black/50">
						{data.title.length}/100 characters
					</div>
				</div>

				<Select
					value={data.propertyType || undefined}
					onValueChange={(v) => updateData({ propertyType: v })}
					options={PROPERTY_TYPE_OPTIONS}
					placeholder="Property Type"
					aria-label="Property Type"
				/>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Select
						value={data.bedrooms !== null ? String(data.bedrooms) : undefined}
						onValueChange={(v) => updateData({ bedrooms: Number(v) })}
						options={ROOM_OPTIONS}
						placeholder="No. of Bedrooms"
						aria-label="No. of Bedrooms"
					/>
					<Select
						value={data.bathrooms !== null ? String(data.bathrooms) : undefined}
						onValueChange={(v) => updateData({ bathrooms: Number(v) })}
						options={ROOM_OPTIONS}
						placeholder="No. of Bathrooms"
						aria-label="No. of Bathrooms"
					/>
				</div>

				<div>
					<Textarea
						placeholder="Brief Description (optional)"
						maxChars={1100}
						showCounter
						value={data.briefDescription}
						onChange={(e) => updateData({ briefDescription: e.target.value })}
					/>
				</div>
			</div>
		</div>
	);
}
