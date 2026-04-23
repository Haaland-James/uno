"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { useListPropertyStore } from "@/stores/listPropertyStore";

const ESSENTIALS = [
	"Water Supply",
	"Electricity",
	"Generator",
	"Inverter/Solar",
	"Borehole",
	"Kitchen Exhaust Fan",
];

const SECURITY = ["Fenced", "Gated", "CCTV", "Security Guard", "Burglar Bars"];

const ADDITIONAL = [
	"Parking",
	"Kitchen Walls Fully Tiled",
	"Bathroom Walls Fully Tiled",
	"POP",
	"Decking",
	"PVC",
	"Wood Ceiling",
];

const MAX_CUSTOM = 10;

export function AmenitiesStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);
	const [customInput, setCustomInput] = useState("");

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

	const renderGroup = (title: string, items: string[]) => (
		<div>
			<h3 className="mb-3 text-[15px] font-semibold text-black">{title}</h3>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{items.map((item) => (
					<Checkbox
						key={item}
						label={item}
						checked={data.amenities.includes(item)}
						onChange={() => toggleAmenity(item)}
					/>
				))}
			</div>
		</div>
	);

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				Please select amenities and features of your property.
			</h1>

			<div className="flex flex-col gap-6">
				{renderGroup("Essentials", ESSENTIALS)}
				{renderGroup("Security", SECURITY)}
				{renderGroup("Additional Features", ADDITIONAL)}

				<div>
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
				</div>

				{data.customAmenities.length > 0 ? (
					<div>
						<h3 className="mb-3 text-[15px] font-semibold text-black/70">
							Custom Amenities
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
					</div>
				) : null}
			</div>
		</div>
	);
}
