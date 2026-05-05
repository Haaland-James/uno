"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { LabeledField } from "@/components/ui/LabeledField";
import { NumberInput } from "@/components/ui/NumberInput";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import {
	AMENITIES_BY_KIND,
	POWER_BACKUP_OPTIONS,
	WATER_SOURCE_OPTIONS,
	type PropertyKind,
} from "@/../config/constants";

const MAX_CUSTOM = 10;

export function AmenitiesStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);
	const [customInput, setCustomInput] = useState("");

	const kind: PropertyKind =
		(data.propertyKind as PropertyKind) || "RESIDENTIAL";
	const groups = AMENITIES_BY_KIND[kind] ?? AMENITIES_BY_KIND.RESIDENTIAL;

	const toggleAmenity = (amenity: string) => {
		const next = data.amenities.includes(amenity)
			? data.amenities.filter((a) => a !== amenity)
			: [...data.amenities, amenity];
		updateData({ amenities: next });
	};

	const addCustom = () => {
		const trimmed = customInput.trim().slice(0, 50);
		if (!trimmed || data.customAmenities.includes(trimmed)) return;
		if (data.customAmenities.length >= MAX_CUSTOM) return;
		updateData({ customAmenities: [...data.customAmenities, trimmed] });
		setCustomInput("");
	};

	const removeCustom = (item: string) => {
		updateData({
			customAmenities: data.customAmenities.filter((a) => a !== item),
		});
	};

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				What does this property offer?
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				Pick everything that applies. Buyers and tenants filter by these.
			</p>

			<div className="flex flex-col gap-7">
				{/* Structured facts — concrete details that filter much better than booleans */}
				<section className="rounded-[16px] border border-black/10 bg-white p-5">
					<h3 className="mb-4 text-[15px] font-semibold text-black">Key Facts</h3>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<LabeledField label="Parking Spaces" helper="Number of cars">
							{({ id }) => (
								<NumberInput
									id={id}
									placeholder="e.g. 2"
									value={data.parkingSpaces}
									onChange={(v) => updateData({ parkingSpaces: v })}
									aria-label="Parking spaces"
								/>
							)}
						</LabeledField>
						<LabeledField label="Power Backup">
							{({ id }) => (
								<Select
									id={id}
									value={data.powerBackup || undefined}
									onValueChange={(v) => updateData({ powerBackup: v })}
									options={POWER_BACKUP_OPTIONS}
									placeholder="Select"
									aria-label="Power Backup"
								/>
							)}
						</LabeledField>
						<LabeledField label="Water Source">
							{({ id }) => (
								<Select
									id={id}
									value={data.waterSource || undefined}
									onValueChange={(v) => updateData({ waterSource: v })}
									options={WATER_SOURCE_OPTIONS}
									placeholder="Select"
									aria-label="Water Source"
								/>
							)}
						</LabeledField>
						<div className="flex items-end">
							<Checkbox
								label="Internet ready (fibre / wireless available)"
								checked={data.internetReady}
								onChange={(v) => updateData({ internetReady: v })}
							/>
						</div>
					</div>
				</section>

				{/* Boolean amenities, grouped by category and filtered by Kind */}
				{groups.map((g) => (
					<section key={g.group}>
						<h3 className="mb-3 text-[15px] font-semibold text-black">
							{g.group}
						</h3>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							{g.items.map((item) => (
								<Checkbox
									key={item}
									label={item}
									checked={data.amenities.includes(item)}
									onChange={() => toggleAmenity(item)}
								/>
							))}
						</div>
					</section>
				))}

				{/* Custom amenities */}
				<section>
					<h3 className="mb-3 text-[15px] font-semibold text-black">
						Add Custom Amenity
					</h3>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={addCustom}
							aria-label="Add custom amenity"
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#af2525] text-white hover:bg-[#93191d] disabled:opacity-40"
							disabled={
								!customInput.trim() ||
								data.customAmenities.length >= MAX_CUSTOM
							}
						>
							<Plus size={18} />
						</button>
						<input
							type="text"
							placeholder="Type here..."
							maxLength={50}
							value={customInput}
							onChange={(e) => setCustomInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addCustom();
								}
							}}
							className="h-10 flex-1 border-0 border-b border-black/20 bg-transparent px-1 text-[15px] text-black outline-none placeholder:text-black/40 focus:border-[#af2525]"
						/>
					</div>
					{data.customAmenities.length >= MAX_CUSTOM ? (
						<p className="mt-1 text-[12px] text-black/50">
							Maximum {MAX_CUSTOM} custom amenities reached.
						</p>
					) : null}
				</section>

				{data.customAmenities.length > 0 ? (
					<section>
						<h3 className="mb-3 text-[15px] font-semibold text-black/70">
							Your custom amenities
						</h3>
						<div className="flex flex-col gap-2">
							{data.customAmenities.map((item) => (
								<div
									key={item}
									className="flex items-center justify-between rounded-[40px] border border-black/15 bg-white px-4 py-2"
								>
									<span className="text-[14px] text-black">{item}</span>
									<button
										type="button"
										onClick={() => removeCustom(item)}
										aria-label={`Remove ${item}`}
										className="flex h-6 w-6 items-center justify-center rounded-full text-black/60 hover:bg-black/5"
									>
										<X size={14} />
									</button>
								</div>
							))}
						</div>
					</section>
				) : null}
			</div>
		</div>
	);
}
