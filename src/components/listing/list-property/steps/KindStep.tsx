"use client";

import { Home, Briefcase, TreePine } from "lucide-react";
import { RadioCard } from "@/components/ui/RadioCard";
import { Select } from "@/components/ui/Select";
import { LabeledField } from "@/components/ui/LabeledField";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { PROPERTY_KINDS, PROPERTY_TYPES_BY_KIND, type PropertyKind } from "@/../config/constants";

const ICONS: Record<PropertyKind, React.ReactNode> = {
	RESIDENTIAL: <Home size={32} strokeWidth={1.5} />,
	COMMERCIAL: <Briefcase size={32} strokeWidth={1.5} />,
	LAND: <TreePine size={32} strokeWidth={1.5} />,
};

export function KindStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	const kind = data.propertyKind as PropertyKind | "";
	const typeOptions = kind ? PROPERTY_TYPES_BY_KIND[kind] : [];

	return (
		<div className="flex flex-col gap-10">
			<section>
				<h1 className="mb-2 text-[22px] font-semibold text-black">
					What kind of property are you listing?
				</h1>
				<p className="mb-6 text-[14px] text-black/60">
					This helps us ask the right questions and surface your listing to the right
					people.
				</p>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{PROPERTY_KINDS.map((opt) => (
						<RadioCard
							key={opt.value}
							selected={kind === opt.value}
							onSelect={() => {
								// If switching kind, clear the previous Type so we don't carry an
								// invalid value across the new kind's option list.
								updateData({
									propertyKind: opt.value,
									propertyType:
										data.propertyType &&
										PROPERTY_TYPES_BY_KIND[opt.value].some(
											(t) => t.value === data.propertyType
										)
											? data.propertyType
											: "",
								});
							}}
							icon={ICONS[opt.value]}
							title={opt.label}
							description={opt.description}
						/>
					))}
				</div>
			</section>

			{kind ? (
				<section>
					<LabeledField
						label="Specific Property Type"
						required
						helper={
							kind === "LAND"
								? "What kind of land are you listing?"
								: kind === "COMMERCIAL"
									? "What kind of commercial space?"
									: "What kind of home is this?"
						}
					>
						{({ id }) => (
							<Select
								id={id}
								value={data.propertyType || undefined}
								onValueChange={(v) => updateData({ propertyType: v })}
								options={typeOptions}
								placeholder="Choose a type"
								aria-label="Property Type"
							/>
						)}
					</LabeledField>
				</section>
			) : null}
		</div>
	);
}
