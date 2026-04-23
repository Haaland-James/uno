"use client";

import { Textarea } from "@/components/ui/Textarea";
import { useListPropertyStore } from "@/stores/listPropertyStore";

export function LeaseTermsStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				Property Lease Terms and Conditions
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				Include details like what payments are due at signing and additional
				property rules.
			</p>
			<Textarea
				placeholder="Property Lease Terms (optional)"
				maxChars={750}
				showCounter
				value={data.leaseTerms}
				onChange={(e) => updateData({ leaseTerms: e.target.value })}
				className="min-h-[220px]"
			/>
		</div>
	);
}
