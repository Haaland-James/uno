"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import { LabeledField } from "@/components/ui/LabeledField";
import { NumberInput } from "@/components/ui/NumberInput";
import { useListPropertyStore } from "@/stores/listPropertyStore";

const TITLE_DOC_OPTS = [
	{ value: "C_OF_O", label: "Certificate of Occupancy (C of O)" },
	{ value: "GOVERNORS_CONSENT", label: "Governor's Consent" },
	{ value: "DEED_OF_ASSIGNMENT", label: "Deed of Assignment" },
	{ value: "GAZETTE", label: "Gazette" },
	{ value: "R_OF_O", label: "Right of Occupancy (R of O)" },
	{ value: "FAMILY_RECEIPT", label: "Family Receipt" },
];

const TOPOGRAPHY_OPTS = [
	{ value: "FLAT", label: "Flat" },
	{ value: "SLOPED", label: "Sloped" },
	{ value: "WATERLOGGED", label: "Waterlogged" },
	{ value: "HILLY", label: "Hilly" },
];

const ACCESS_ROAD_OPTS = [
	{ value: "TARRED", label: "Tarred Road" },
	{ value: "EARTH", label: "Earth Road" },
	{ value: "NONE", label: "No Direct Road Access" },
];

export function LandDetailsStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				Tell us about the land
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				Buyers care most about title, size, and access. Be precise — it builds trust.
			</p>

			<div className="flex flex-col gap-5">
				<LabeledField
					label="Listing Title"
					required
					helper={`${data.title.length}/100 characters`}
				>
					{({ id }) => (
						<Input
							id={id}
							placeholder="e.g. 2 Plots of Dry Land in Lekki Phase 2"
							maxLength={100}
							value={data.title}
							onChange={(e) => updateData({ title: e.target.value })}
						/>
					)}
				</LabeledField>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<LabeledField label="Plot Size" required helper="In square metres">
						{({ id }) => (
							<NumberInput
								id={id}
								placeholder="e.g. 648"
								suffix="sqm"
								value={data.plotSizeSqm}
								onChange={(v) => updateData({ plotSizeSqm: v })}
								aria-label="Plot size in square metres"
							/>
						)}
					</LabeledField>
					<LabeledField label="Title Document" required>
						{({ id }) => (
							<Select
								id={id}
								value={data.titleDocType || undefined}
								onValueChange={(v) => updateData({ titleDocType: v })}
								options={TITLE_DOC_OPTS}
								placeholder="Select title type"
								aria-label="Title Document Type"
							/>
						)}
					</LabeledField>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<LabeledField label="Topography">
						{({ id }) => (
							<Select
								id={id}
								value={data.topography || undefined}
								onValueChange={(v) => updateData({ topography: v })}
								options={TOPOGRAPHY_OPTS}
								placeholder="Select"
								aria-label="Topography"
							/>
						)}
					</LabeledField>
					<LabeledField label="Access Road">
						{({ id }) => (
							<Select
								id={id}
								value={data.accessRoad || undefined}
								onValueChange={(v) => updateData({ accessRoad: v })}
								options={ACCESS_ROAD_OPTS}
								placeholder="Select"
								aria-label="Access Road"
							/>
						)}
					</LabeledField>
				</div>

				<div className="flex flex-col gap-3 rounded-[16px] border border-black/10 bg-white p-4">
					<Checkbox
						label="Survey plan available"
						checked={data.surveyAvailable}
						onChange={(v) => updateData({ surveyAvailable: v })}
					/>
					<Checkbox
						label="Land is fenced"
						checked={data.fencing}
						onChange={(v) => updateData({ fencing: v })}
					/>
				</div>

				<LabeledField label="Brief Description" helper="Optional — share anything that makes this plot stand out">
					{({ id }) => (
						<Textarea
							id={id}
							placeholder="e.g. Dry land, no encumbrances, ready for development."
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
