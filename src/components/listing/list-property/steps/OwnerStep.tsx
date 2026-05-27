"use client";

import { Input } from "@/components/ui/Input";
import { LabeledField } from "@/components/ui/LabeledField";
import { useListPropertyStore } from "@/stores/listPropertyStore";

/**
 * Off-platform owner step. Only shown to in-house UNO agents — the wizard
 * injects it after the LocationStep when getSteps() is called with
 * isInHouseAgent=true.
 *
 * The values here are private metadata: they're stored on the Property row
 * for the agent's records but never rendered on any public surface. Renters
 * see "Listed by UNO" + the agent's profile — they never see the real owner.
 */
export function OwnerStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				Who owns this property?
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				Capture the landlord&apos;s contact details for your records. These are
				private to you — renters only see &ldquo;Listed by UNO&rdquo; and your agent profile.
			</p>

			<div className="flex flex-col gap-5">
				<LabeledField label="Owner&apos;s full name" required>
					{({ id }) => (
						<Input
							id={id}
							placeholder="e.g. Mr. Effiong Akpan"
							value={data.offPlatformOwnerName}
							onChange={(e) =>
								updateData({ offPlatformOwnerName: e.target.value })
							}
						/>
					)}
				</LabeledField>
				<LabeledField
					label="Owner&apos;s phone number"
					required
					helper="So you can reach them about viewings, offers, and renewals."
				>
					{({ id }) => (
						<Input
							id={id}
							type="tel"
							placeholder="08012345678"
							value={data.offPlatformOwnerPhone}
							onChange={(e) =>
								updateData({ offPlatformOwnerPhone: e.target.value })
							}
						/>
					)}
				</LabeledField>
			</div>

			<div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] text-amber-800">
				<strong>Reminder:</strong> only list properties you&apos;ve personally
				inspected and have the owner&apos;s consent to publish. UNO&apos;s reputation
				is tied to your listings.
			</div>
		</div>
	);
}
