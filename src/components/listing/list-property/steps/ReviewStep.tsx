"use client";

import { Pencil } from "lucide-react";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { formatNaira } from "@/lib/utils";
import type { FeeValue } from "@/components/ui/FeeInput";
import { getSteps } from "../steps";

function formatFee(fee: FeeValue | null | undefined, base: number | null): string | null {
	if (!fee || fee.value === null || fee.value === 0) return null;
	if (fee.mode === "PERCENT") {
		const computed = base ? Math.round((base * fee.value) / 100) : null;
		return computed
			? `${fee.value}% (≈ ${formatNaira(computed)})`
			: `${fee.value}%`;
	}
	return formatNaira(fee.value);
}

interface ReviewStepProps {
	onEdit: (stepIndex: number) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4 py-1.5 text-[14px]">
			<span className="text-black/60">{label}</span>
			<span className="text-right text-black">
				{value || <span className="text-black/30">—</span>}
			</span>
		</div>
	);
}

function Section({
	title,
	stepIndex,
	onEdit,
	children,
}: {
	title: string;
	stepIndex: number;
	onEdit: (i: number) => void;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-[18px] border border-black/10 bg-white p-5">
			<div className="mb-2 flex items-center justify-between">
				<h3 className="text-[15px] font-semibold text-black">{title}</h3>
				<button
					type="button"
					onClick={() => onEdit(stepIndex)}
					className="inline-flex items-center gap-1 text-[13px] font-medium text-[#af2525] hover:underline"
				>
					<Pencil size={12} /> Edit
				</button>
			</div>
			<div className="flex flex-col divide-y divide-black/5">{children}</div>
		</div>
	);
}

export function ReviewStep({ onEdit }: ReviewStepProps) {
	const data = useListPropertyStore((s) => s.data);
	const wizardKind = (data.propertyKind || "") as "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "";
	const steps = getSteps(data.objective, wizardKind);
	const stepIdx = (key: string) => steps.findIndex((s) => s.key === key);

	const isSell = data.objective === "SELL";
	const isLand = data.propertyKind === "LAND";
	const isCommercial = data.propertyKind === "COMMERCIAL";

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				Review your listing
			</h1>

			<div className="flex flex-col gap-4">
				<Section title="Overview" stepIndex={stepIdx("overview")} onEdit={onEdit}>
					<Row label="Objective" value={data.objective} />
					<Row label="Role" value={data.role} />
				</Section>

				<Section title="Property Kind" stepIndex={stepIdx("kind")} onEdit={onEdit}>
					<Row label="Kind" value={data.propertyKind} />
					<Row label="Type" value={data.propertyType} />
				</Section>

				<Section title="Location" stepIndex={stepIdx("location")} onEdit={onEdit}>
					<Row label="State" value={data.state} />
					<Row label="LGA" value={data.lga} />
					<Row label="Area" value={data.area} />
					<Row label="Street Address" value={data.streetAddress} />
					<Row
						label="Map Coordinates"
						value={
							data.latitude !== null && data.longitude !== null
								? `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`
								: null
						}
					/>
					<Row
						label="Public Address"
						value={data.fullAddressVisible ? "Visible" : "Hidden (area only)"}
					/>
				</Section>

				{isLand ? (
					<Section title="Land Details" stepIndex={stepIdx("land-details")} onEdit={onEdit}>
						<Row label="Title" value={data.title} />
						<Row label="Plot Size" value={data.plotSizeSqm ? `${data.plotSizeSqm} sqm` : null} />
						<Row label="Title Document" value={data.titleDocType} />
						<Row label="Topography" value={data.topography} />
						<Row label="Access Road" value={data.accessRoad} />
						<Row label="Survey Available" value={data.surveyAvailable ? "Yes" : "No"} />
						<Row label="Fenced" value={data.fencing ? "Yes" : "No"} />
					</Section>
				) : (
					<>
						<Section title="Property Info" stepIndex={stepIdx("property-info")} onEdit={onEdit}>
							<Row label="Title" value={data.title} />
							{isCommercial ? (
								<>
									<Row label="Floor Area" value={data.floorAreaSqm ? `${data.floorAreaSqm} sqm` : null} />
									<Row label="Floor Level" value={data.floorLevel} />
									<Row label="Units" value={data.units} />
									<Row label="Fit-out" value={data.fitOutState} />
								</>
							) : (
								<>
									<Row label="Bedrooms" value={data.bedrooms} />
									<Row label="Bathrooms" value={data.bathrooms} />
								</>
							)}
						</Section>

						<Section title="Description" stepIndex={stepIdx("description")} onEdit={onEdit}>
							<Row label="Size" value={data.size ? `${data.size} sqm` : null} />
							<Row label="Year Built" value={data.yearBuilt} />
							<Row label="Furnishing" value={data.furnishing} />
							<Row label="Condition" value={data.condition} />
							<Row label="Ownership" value={data.ownershipType} />
						</Section>

						<Section title="Amenities" stepIndex={stepIdx("amenities")} onEdit={onEdit}>
							<Row label="Parking Spaces" value={data.parkingSpaces} />
							<Row label="Power Backup" value={data.powerBackup} />
							<Row label="Water Source" value={data.waterSource} />
							<Row label="Internet Ready" value={data.internetReady ? "Yes" : "No"} />
							<Row
								label="Other"
								value={[...data.amenities, ...data.customAmenities].join(", ")}
							/>
						</Section>
					</>
				)}

				<Section title="Photos" stepIndex={stepIdx("photos")} onEdit={onEdit}>
					<Row label="Count" value={data.photoNames.length} />
				</Section>

				<Section title="Pricing" stepIndex={stepIdx("pricing")} onEdit={onEdit}>
					{isSell ? (
						<>
							<Row
								label="Sale Price"
								value={data.salePrice ? formatNaira(data.salePrice) : null}
							/>
							<Row label="Negotiable" value={data.negotiable ? "Yes" : "No"} />
						</>
					) : (
						<>
							<Row
								label="Rent"
								value={
									data.rent
										? `${formatNaira(data.rent)} / ${data.rentPeriod === "YEAR" ? "yr" : "mo"}`
										: null
								}
							/>
							<Row label="Minimum Lease" value={data.minimumLease} />
							<Row
								label="Agency Fee"
								value={formatFee(data.agencyFee, data.rent)}
							/>
							<Row
								label="Legal Fee"
								value={formatFee(data.legalFee, data.rent)}
							/>
							<Row
								label="Caution / Deposit"
								value={
									data.cautionDeposit ? formatNaira(data.cautionDeposit) : null
								}
							/>
							<Row label="Availability" value={data.availability} />
						</>
					)}
				</Section>

				{!isSell ? (
					<Section
						title="Lease Terms"
						stepIndex={stepIdx("lease-terms")}
						onEdit={onEdit}
					>
						<Row label="Terms" value={data.leaseTerms || "Not provided"} />
					</Section>
				) : null}

				<Section title="Contact" stepIndex={stepIdx("contact")} onEdit={onEdit}>
					<Row
						label="Name"
						value={`${data.contactFirstName} ${data.contactLastName}`.trim()}
					/>
					<Row label="Email" value={data.contactEmail} />
					<Row label="Phone" value={data.contactPhone} />
				</Section>
			</div>
		</div>
	);
}
