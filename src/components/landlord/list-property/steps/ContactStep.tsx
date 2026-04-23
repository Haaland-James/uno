"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { useUserStore } from "@/stores/userStore";

export function ContactStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);
	const user = useUserStore((s) => s.user);

	// Pre-fill from user profile on first visit if fields are empty
	useEffect(() => {
		if (!user) return;
		const patch: Partial<typeof data> = {};
		if (!data.contactFirstName && !data.contactLastName && user.name) {
			const [first, ...rest] = user.name.split(" ");
			patch.contactFirstName = first ?? "";
			patch.contactLastName = rest.join(" ");
		}
		if (!data.contactEmail && user.email) patch.contactEmail = user.email;
		if (!data.contactPhone && user.phone) patch.contactPhone = user.phone;
		if (Object.keys(patch).length > 0) updateData(patch);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				Who is listing this property?
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				We&apos;ve pre-filled this from your profile. Edit if you&apos;re listing on
				someone else&apos;s behalf.
			</p>

			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Input
						placeholder="First Name"
						value={data.contactFirstName}
						onChange={(e) => updateData({ contactFirstName: e.target.value })}
					/>
					<Input
						placeholder="Last Name"
						value={data.contactLastName}
						onChange={(e) => updateData({ contactLastName: e.target.value })}
					/>
				</div>
				<Input
					type="email"
					placeholder="Email"
					value={data.contactEmail}
					onChange={(e) => updateData({ contactEmail: e.target.value })}
				/>
				<Input
					type="tel"
					placeholder="Phone Number"
					value={data.contactPhone}
					onChange={(e) => updateData({ contactPhone: e.target.value })}
				/>
			</div>
		</div>
	);
}
