"use client";

import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { LabeledField } from "@/components/ui/LabeledField";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { FeeInput, type FeeValue } from "@/components/ui/FeeInput";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { RENT_PERIODS } from "@/../config/constants";

// Defensive coercion for fee fields. Drafts persisted under the old store
// shape stored fees as plain numbers; this re-shapes them to FeeValue so the
// component never tries to read `.mode` off a number.
function coerceFee(input: unknown): FeeValue {
	if (input && typeof input === "object" && "mode" in input && "value" in input) {
		const f = input as { mode?: unknown; value?: unknown };
		return {
			mode: f.mode === "PERCENT" ? "PERCENT" : "FIXED",
			value: typeof f.value === "number" && Number.isFinite(f.value) ? f.value : null,
		};
	}
	if (typeof input === "number" && Number.isFinite(input)) {
		return { mode: "FIXED", value: input };
	}
	return { mode: "FIXED", value: null };
}

const PERIOD_OPTS = RENT_PERIODS.map((p) => ({ value: p.value, label: p.label }));

const LEASE_OPTS = [
	{ value: "6_MONTHS", label: "6 Months" },
	{ value: "1_YEAR", label: "1 Year" },
	{ value: "2_YEARS", label: "2 Years" },
	{ value: "3_YEARS", label: "3 Years" },
	{ value: "5_YEARS", label: "5 Years" },
];

const SERVICE_INCLUDES = [
	{ value: "WASTE", label: "Waste Disposal" },
	{ value: "CLEANING", label: "Common Area Cleaning" },
	{ value: "SECURITY", label: "Security" },
	{ value: "MAINTENANCE", label: "General Maintenance" },
	{ value: "ALL", label: "All of the above" },
];

export function PricingStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	const isSell = data.objective === "SELL";
	const agencyFee = coerceFee(data.agencyFee);
	const legalFee = coerceFee(data.legalFee);

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				{isSell ? "Sale Price" : "Pricing & Availability"}
			</h1>

			{isSell ? (
				<div className="flex flex-col gap-5">
					<LabeledField
						label="Sale Price"
						required
						helper="Amount in Nigerian Naira (₦)"
					>
						{({ id }) => (
							<MoneyInput
								id={id}
								value={data.salePrice}
								onChange={(v) => updateData({ salePrice: v })}
								placeholder="25,000,000"
								aria-label="Sale Price"
							/>
						)}
					</LabeledField>

					<Checkbox
						label="Price is negotiable"
						checked={data.negotiable}
						onChange={(v) => updateData({ negotiable: v })}
					/>

					<LabeledField
						label="Title Documents"
						helper="e.g. Certificate of Occupancy, Deed of Assignment"
					>
						{({ id }) => (
							<Input
								id={id}
								placeholder="C of O, Deed of Assignment, Governor's Consent…"
								value={data.titleDocuments}
								onChange={(e) => updateData({ titleDocuments: e.target.value })}
							/>
						)}
					</LabeledField>
				</div>
			) : (
				<div className="flex flex-col gap-7">
					<section>
						<h3 className="mb-3 text-[14px] font-semibold text-black">
							Set Basic Rent Price
						</h3>
						<div className="flex flex-col gap-5">
							<LabeledField
								label="Rent Amount"
								required
								helper="Minimum ₦10,000"
							>
								{({ id }) => (
									<MoneyInput
										id={id}
										value={data.rent}
										onChange={(v) => updateData({ rent: v })}
										placeholder="350,000"
										aria-label="Rent Amount"
									/>
								)}
							</LabeledField>
							<LabeledField label="Payment Period" required>
								{({ id }) => (
									<Select
										id={id}
										value={data.rentPeriod}
										onValueChange={(v) =>
											updateData({ rentPeriod: v as "MONTH" | "YEAR" })
										}
										options={PERIOD_OPTS}
										placeholder="How is rent paid?"
										aria-label="Payment Period"
									/>
								)}
							</LabeledField>
							<LabeledField label="Minimum Lease Period" required>
								{({ id }) => (
									<Select
										id={id}
										value={data.minimumLease || undefined}
										onValueChange={(v) => updateData({ minimumLease: v })}
										options={LEASE_OPTS}
										placeholder="Shortest stay you'll accept"
										aria-label="Minimum Lease Period"
									/>
								)}
							</LabeledField>
						</div>
					</section>

					<section>
						<h3 className="mb-1 text-[14px] font-semibold text-black">
							One-Time Fees
						</h3>
						<p className="mb-3 text-[12px] text-black/60">
							Charged once at the start of the tenancy. Toggle{" "}
							<span className="font-medium">₦</span> /{" "}
							<span className="font-medium">%</span> to enter a fixed amount or a
							percentage of the rent.
						</p>
						<div className="flex flex-col gap-5">
							<LabeledField
								label="Agency Fee"
								helper={
									agencyFee.mode === "PERCENT"
										? "Standard in Nigeria: 10%"
										: "Optional"
								}
							>
								{({ id }) => (
									<FeeInput
										id={id}
										value={agencyFee}
										onChange={(v) => updateData({ agencyFee: v })}
										baseAmount={data.rent}
										aria-label="Agency Fee"
									/>
								)}
							</LabeledField>
							<LabeledField
								label="Legal Fee"
								helper={
									legalFee.mode === "PERCENT"
										? "Typically 5–10%"
										: "Optional"
								}
							>
								{({ id }) => (
									<FeeInput
										id={id}
										value={legalFee}
										onChange={(v) => updateData({ legalFee: v })}
										baseAmount={data.rent}
										aria-label="Legal Fee"
									/>
								)}
							</LabeledField>
							<LabeledField label="Caution / Deposit" helper="Refundable security deposit">
								{({ id }) => (
									<MoneyInput
										id={id}
										value={data.cautionDeposit}
										onChange={(v) => updateData({ cautionDeposit: v })}
										placeholder="0"
										aria-label="Caution / Deposit"
									/>
								)}
							</LabeledField>
						</div>
					</section>

					<section>
						<h3 className="mb-3 text-[14px] font-semibold text-black">
							Recurring Additional Costs
						</h3>
						<div className="flex flex-col gap-5">
							<LabeledField
								label="Yearly Service Charge"
								helper="Optional — for shared estate services"
							>
								{({ id }) => (
									<MoneyInput
										id={id}
										value={data.serviceCharge}
										onChange={(v) => updateData({ serviceCharge: v })}
										placeholder="0"
										aria-label="Yearly Service Charge"
									/>
								)}
							</LabeledField>
							<LabeledField label="What's included in service charge?">
								{({ id }) => (
									<Select
										id={id}
										value={data.serviceChargeIncludes || undefined}
										onValueChange={(v) =>
											updateData({ serviceChargeIncludes: v })
										}
										options={SERVICE_INCLUDES}
										placeholder="Select what's covered"
										aria-label="What's included in service charge"
									/>
								)}
							</LabeledField>
						</div>
					</section>

					<section>
						<h3 className="mb-3 text-[14px] font-semibold text-black">
							Availability
						</h3>
						<div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
							<label className="inline-flex cursor-pointer items-center gap-2">
								<input
									type="radio"
									name="availability"
									className="accent-[#af2525]"
									checked={data.availability === "AVAILABLE_NOW"}
									onChange={() => updateData({ availability: "AVAILABLE_NOW" })}
								/>
								<span className="text-[14px]">Available Now</span>
							</label>
							<label className="inline-flex cursor-pointer items-center gap-2">
								<input
									type="radio"
									name="availability"
									className="accent-[#af2525]"
									checked={data.availability === "AVAILABLE_FROM"}
									onChange={() =>
										updateData({ availability: "AVAILABLE_FROM" })
									}
								/>
								<span className="text-[14px]">Available on Specific Date</span>
								<Calendar size={14} className="text-black/40" />
							</label>
						</div>
						{data.availability === "AVAILABLE_FROM" ? (
							<div className="mt-3 max-w-[260px]">
								<LabeledField label="Available From">
									{({ id }) => (
										<Input
											id={id}
											type="date"
											value={data.availableFrom}
											onChange={(e) =>
												updateData({ availableFrom: e.target.value })
											}
										/>
									)}
								</LabeledField>
							</div>
						) : null}
					</section>
				</div>
			)}
		</div>
	);
}
