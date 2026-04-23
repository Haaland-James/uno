"use client";

import { Pencil } from "lucide-react";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { formatNaira } from "@/lib/utils";
import { getSteps } from "../steps";

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
	const steps = getSteps(data.objective);
	const stepIdx = (key: string) => steps.findIndex((s) => s.key === key);

	const isSell = data.objective === "SELL";

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

				<Section title="Location" stepIndex={stepIdx("location")} onEdit={onEdit}>
					<Row label="State" value={data.state} />
					<Row label="City" value={data.city} />
					<Row label="Address" value={[data.streetAddress, data.unit].filter(Boolean).join(", ")} />
					<Row label="Zip" value={data.zipCode} />
				</Section>

				<Section title="Property Info" stepIndex={stepIdx("property-info")} onEdit={onEdit}>
					<Row label="Title" value={data.title} />
					<Row label="Type" value={data.propertyType} />
					<Row label="Bedrooms" value={data.bedrooms} />
					<Row label="Bathrooms" value={data.bathrooms} />
				</Section>

				<Section title="Description" stepIndex={stepIdx("description")} onEdit={onEdit}>
					<Row label="Size" value={data.size ? `${data.size} sqm` : null} />
					<Row label="Year Built" value={data.yearBuilt} />
					<Row label="Furnishing" value={data.furnishing} />
					<Row label="Condition" value={data.condition} />
					<Row label="Ownership" value={data.ownershipType} />
				</Section>

				<Section title="Amenities" stepIndex={stepIdx("amenities")} onEdit={onEdit}>
					<Row
						label="Selected"
						value={[...data.amenities, ...data.customAmenities].join(", ")}
					/>
				</Section>

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
								value={data.agencyFee ? formatNaira(data.agencyFee) : null}
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
