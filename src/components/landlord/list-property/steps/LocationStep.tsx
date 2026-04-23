"use client";

import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { NIGERIAN_STATES } from "@/../config/constants";

const STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

export function LocationStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				Where is your property located?
			</h1>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Select
					value={data.state || undefined}
					onValueChange={(v) => updateData({ state: v })}
					options={STATE_OPTIONS}
					placeholder="State"
					aria-label="State"
				/>
				<Input
					placeholder="Postal Code (optional)"
					value={data.zipCode}
					onChange={(e) => updateData({ zipCode: e.target.value })}
				/>
				<Input
					placeholder="Street Address"
					className="sm:col-span-2"
					value={data.streetAddress}
					onChange={(e) => updateData({ streetAddress: e.target.value })}
				/>
				<Input
					placeholder="Unit (Optional)"
					className="sm:col-span-2"
					value={data.unit}
					onChange={(e) => updateData({ unit: e.target.value })}
				/>
				<Input
					placeholder="City / Area e.g. Lekki, Ikeja"
					className="sm:col-span-2"
					value={data.city}
					onChange={(e) => updateData({ city: e.target.value, area: e.target.value })}
				/>
			</div>

			<div className="relative mt-6 overflow-hidden rounded-[18px] border border-black/10 bg-[#f5f3ee] aspect-[16/8]">
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="flex flex-col items-center gap-2 text-black/40">
						<MapPin size={28} />
						<span className="text-[13px]">
							{data.city ? `Approximate location near ${data.city}` : "Map preview"}
						</span>
					</div>
				</div>
				<div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[12px] text-black/70 shadow-card">
					We will share your approximate location
				</div>
			</div>
		</div>
	);
}
