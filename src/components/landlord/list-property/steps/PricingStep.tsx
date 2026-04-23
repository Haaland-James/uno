"use client";

import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { RENT_PERIODS } from "@/../config/constants";

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

	return (
		<div>
			<h1 className="mb-6 text-[22px] font-semibold text-black">
				{isSell ? "Sale Price" : "Pricing & Availability"}
			</h1>

			{isSell ? (
				<div className="flex flex-col gap-4">
					<Input
						type="number"
						placeholder="Sale Price e.g. ₦25,000,000"
						value={data.salePrice ?? ""}
						onChange={(e) =>
							updateData({
								salePrice: e.target.value ? Number(e.target.value) : null,
							})
						}
					/>
					<Checkbox
						label="Price is negotiable"
						checked={data.negotiable}
						onChange={(v) => updateData({ negotiable: v })}
					/>
					<Input
						placeholder="Title Documents e.g. C of O, Deed of Assignment (optional)"
						value={data.titleDocuments}
						onChange={(e) => updateData({ titleDocuments: e.target.value })}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-6">
					<div>
						<h3 className="mb-3 text-[14px] font-semibold text-black">
							Set Basic Rent Price
						</h3>
						<div className="flex flex-col gap-4">
							<Input
								type="number"
								placeholder="Rent Amount e.g. ₦ 350,000"
								value={data.rent ?? ""}
								onChange={(e) =>
									updateData({
										rent: e.target.value ? Number(e.target.value) : null,
									})
								}
							/>
							<Select
								value={data.rentPeriod}
								onValueChange={(v) =>
									updateData({ rentPeriod: v as "MONTH" | "YEAR" })
								}
								options={PERIOD_OPTS}
								placeholder="Payment Period"
								aria-label="Payment Period"
							/>
							<Select
								value={data.minimumLease || undefined}
								onValueChange={(v) => updateData({ minimumLease: v })}
								options={LEASE_OPTS}
								placeholder="Minimum Lease Period"
								aria-label="Minimum Lease Period"
							/>
						</div>
					</div>

					<div>
						<h3 className="mb-1 text-[14px] font-semibold text-black">
							Additional Pricing Options
						</h3>
						<p className="mb-3 text-[12px] text-black/60">
							One-time fees charged on top of the basic rent.
						</p>
						<div className="flex flex-col gap-4">
							<Input
								type="number"
								placeholder="Agency Fee ₦ (optional)"
								value={data.agencyFee ?? ""}
								onChange={(e) =>
									updateData({
										agencyFee: e.target.value ? Number(e.target.value) : null,
									})
								}
							/>
							<Input
								type="number"
								placeholder="Caution / Deposit ₦ (optional)"
								value={data.cautionDeposit ?? ""}
								onChange={(e) =>
									updateData({
										cautionDeposit: e.target.value
											? Number(e.target.value)
											: null,
									})
								}
							/>
						</div>
					</div>

					<div>
						<h3 className="mb-3 text-[14px] font-semibold text-black">
							Recurring Additional Costs
						</h3>
						<div className="flex flex-col gap-4">
							<Input
								type="number"
								placeholder="Yearly service charge Amount: ₦ (optional)"
								value={data.serviceCharge ?? ""}
								onChange={(e) =>
									updateData({
										serviceCharge: e.target.value
											? Number(e.target.value)
											: null,
									})
								}
							/>
							<Select
								value={data.serviceChargeIncludes || undefined}
								onValueChange={(v) => updateData({ serviceChargeIncludes: v })}
								options={SERVICE_INCLUDES}
								placeholder="What's included in service charge"
								aria-label="What's included in service charge"
							/>
						</div>
					</div>

					<div>
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
								<Input
									type="date"
									value={data.availableFrom}
									onChange={(e) => updateData({ availableFrom: e.target.value })}
								/>
							</div>
						) : null}
					</div>
				</div>
			)}
		</div>
	);
}
