"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LabeledField } from "@/components/ui/LabeledField";
import { AreaCombobox } from "@/components/ui/AreaCombobox";
import { useListPropertyStore } from "@/stores/listPropertyStore";

// Mapbox GL is a heavy, browser-only library. Skip SSR so its module-level
// `window` references never run server-side.
const LocationMapPicker = dynamic(
	() => import("../LocationMapPicker").then((m) => m.LocationMapPicker),
	{
		ssr: false,
		loading: () => (
			<div className="h-[280px] w-full animate-pulse rounded-[18px] bg-black/5" />
		),
	}
);
import {
	NIGERIAN_STATES,
	LGAS_BY_STATE,
	getAreasForLga,
} from "@/../config/constants";

const STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

export function LocationStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	const lgaOptions = useMemo(() => {
		const list = LGAS_BY_STATE[data.state] ?? [];
		return list.map((l) => ({ value: l, label: l }));
	}, [data.state]);

	const areaSuggestions = useMemo(
		() => getAreasForLga(data.state, data.lga),
		[data.state, data.lga]
	);

	// Combined query for the map's forward-geocoder. Updates as the user fills fields.
	const addressQuery = useMemo(() => {
		return [data.streetAddress, data.area, data.lga, data.state, "Nigeria"]
			.filter(Boolean)
			.join(", ");
	}, [data.streetAddress, data.area, data.lga, data.state]);

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				Where is your property located?
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				Pick the state and LGA, then tell us the area and street.
			</p>

			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<LabeledField label="State" required>
					{({ id }) => (
						<Select
							id={id}
							value={data.state || undefined}
							onValueChange={(v) =>
								updateData({ state: v, lga: "", area: "", city: "" })
							}
							options={STATE_OPTIONS}
							placeholder="Select state"
							aria-label="State"
						/>
					)}
				</LabeledField>

				<LabeledField
					label="LGA / Municipality"
					required
					helper={
						data.state && lgaOptions.length === 0
							? "No LGAs seeded for this state — type the area below."
							: undefined
					}
				>
					{({ id }) => (
						<Select
							id={id}
							value={data.lga || undefined}
							onValueChange={(v) => updateData({ lga: v, area: "", city: v })}
							options={lgaOptions}
							placeholder={data.state ? "Select LGA" : "Pick a state first"}
							disabled={!data.state || lgaOptions.length === 0}
							aria-label="LGA / Municipality"
						/>
					)}
				</LabeledField>

				<LabeledField
					label="Area / Neighbourhood"
					required
					className="sm:col-span-2"
					helper={
						areaSuggestions.length === 0 && data.lga
							? "Start typing — we'll add it if it's new."
							: undefined
					}
				>
					{({ id }) => (
						<AreaCombobox
							id={id}
							value={data.area}
							onChange={(v) => updateData({ area: v, city: data.lga || v })}
							suggestions={areaSuggestions}
							placeholder="e.g. Lekki Phase 1, GRA, Bodija"
							disabled={!data.state}
							aria-label="Area / Neighbourhood"
						/>
					)}
				</LabeledField>

				<LabeledField
					label="Street Address"
					required
					className="sm:col-span-2"
					helper="Building number and street name"
				>
					{({ id }) => (
						<Input
							id={id}
							placeholder="e.g. 12 Adeola Odeku Street"
							value={data.streetAddress}
							onChange={(e) => updateData({ streetAddress: e.target.value })}
						/>
					)}
				</LabeledField>
			</div>

			<div className="mt-6">
				<LocationMapPicker
					addressQuery={addressQuery}
					latitude={data.latitude}
					longitude={data.longitude}
					onLocationChange={({ latitude, longitude, geocodeAccuracy }) =>
						updateData({ latitude, longitude, geocodeAccuracy })
					}
				/>
			</div>

			<div className="mt-5">
				<button
					type="button"
					onClick={() =>
						updateData({ fullAddressVisible: !data.fullAddressVisible })
					}
					className="flex w-full items-start justify-between gap-4 rounded-[16px] border border-black/10 bg-white p-4 text-left transition-colors hover:bg-black/[0.02]"
				>
					<div className="flex items-start gap-3">
						{data.fullAddressVisible ? (
							<Eye size={18} className="mt-0.5 shrink-0 text-black" />
						) : (
							<EyeOff size={18} className="mt-0.5 shrink-0 text-black" />
						)}
						<div>
							<p className="text-[14px] font-semibold text-black">
								{data.fullAddressVisible
									? "Show full street address publicly"
									: "Hide full street address (recommended)"}
							</p>
							<p className="mt-0.5 text-[12px] text-black/55">
								{data.fullAddressVisible
									? "Your exact address will appear on the public listing."
									: "Public listing shows only Area + an approximate pin. Buyers see the full address after they contact you."}
							</p>
						</div>
					</div>
					<div
						className={`mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
							data.fullAddressVisible ? "bg-[#af2525]" : "bg-black/15"
						}`}
					>
						<div
							className={`h-5 w-5 rounded-full bg-white transition-transform ${
								data.fullAddressVisible ? "translate-x-5" : "translate-x-0"
							}`}
						/>
					</div>
				</button>
			</div>
		</div>
	);
}
