"use client";

import { Home, Building2, Zap, User, Users } from "lucide-react";
import { RadioCard } from "@/components/ui/RadioCard";
import {
	useListPropertyStore,
	type ListingObjective,
	type ListerRole,
} from "@/stores/listPropertyStore";

const OBJECTIVES: { value: ListingObjective; title: string; description: string; icon: React.ReactNode }[] = [
	{
		value: "SELL",
		title: "Sell Property",
		description: "I am looking to sell my property.",
		icon: <Home size={36} strokeWidth={1.5} />,
	},
	{
		value: "RENT",
		title: "Rent Property",
		description: "Yearly tenancy, paid upfront.",
		icon: <Building2 size={36} strokeWidth={1.5} />,
	},
	{
		value: "LEASE",
		title: "Lease Property",
		description: "Long-term agreement, multiple years.",
		icon: <Zap size={36} strokeWidth={1.5} />,
	},
];

export function ObjectiveStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);

	return (
		<div className="flex flex-col gap-10">
			<section>
				<h1 className="mb-6 text-[22px] font-semibold text-black">
					What is your objective?
				</h1>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{OBJECTIVES.map((opt) => (
						<RadioCard
							key={opt.value}
							selected={data.objective === opt.value}
							onSelect={() => updateData({ objective: opt.value })}
							icon={opt.icon}
							title={opt.title}
							description={opt.description}
						/>
					))}
				</div>
			</section>

			{data.objective ? (
				<section>
					<h1 className="mb-6 text-[22px] font-semibold text-black">
						What is your role for the property?
					</h1>
					<div className="flex flex-col gap-3">
						<RadioCard
							horizontal
							selected={data.role === "OWNER"}
							onSelect={() => updateData({ role: "OWNER" satisfies ListerRole })}
							icon={<User size={20} />}
							title="I am the owner of the property"
						/>
						<RadioCard
							horizontal
							selected={data.role === "REPRESENTATIVE"}
							onSelect={() =>
								updateData({ role: "REPRESENTATIVE" satisfies ListerRole })
							}
							icon={<Users size={20} />}
							title="I am a representative of the owner"
						/>
					</div>
				</section>
			) : null}
		</div>
	);
}
