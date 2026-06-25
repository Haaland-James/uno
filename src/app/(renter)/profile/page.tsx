"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Settings as SettingsIcon,
	CircleMinus,
} from "lucide-react";

function GenderIcon({ size = 20 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="10" cy="14" r="5" />
			<path d="M19 5l-5.5 5.5" />
			<path d="M14 5h5v5" />
		</svg>
	);
}
import { useUserStore } from "@/stores/userStore";
import { toast } from "@/stores/toastStore";
import { AvatarRow } from "@/components/profile/AvatarRow";
import { ProfileRow } from "@/components/profile/ProfileRow";
import {
	NameEditor,
	GenderEditor,
	SimpleEditor,
} from "@/components/profile/editors";
import type { Gender } from "@/types";

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((n) => n[0].toUpperCase())
		.join("");
}

const GENDER_LABELS: Record<Gender, string> = {
	MALE: "Male",
	FEMALE: "Female",
	NON_BINARY: "Non-binary",
	PREFER_NOT_TO_SAY: "Prefer not to say",
};

type RowKey = "name" | "gender" | "email" | "phone" | "address";

async function patchProfile(patch: Record<string, unknown>) {
	const res = await fetch("/api/me", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(patch),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.error?.message ?? "Failed to save");
	}
	const { data } = await res.json();
	return data;
}

export default function ProfilePage() {
	const router = useRouter();
	const user = useUserStore((s) => s.user);
	const updateUser = useUserStore((s) => s.updateUser);

	const [openRow, setOpenRow] = useState<RowKey | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch("/api/me")
			.then((r) => r.json())
			.then(({ data }) => {
				if (data) updateUser(data);
			})
			.catch(() => {});
	}, [updateUser]);

	const save = useCallback(
		async (patch: Record<string, unknown>) => {
			setSaving(true);
			try {
				const updated = await patchProfile(patch);
				updateUser(updated);
				setOpenRow(null);
				toast.success("Profile updated");
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Failed to save");
			} finally {
				setSaving(false);
			}
		},
		[updateUser]
	);

	if (!user) return null;

	const toggle = (key: RowKey) =>
		setOpenRow((prev) => (prev === key ? null : key));

	const initials = user.name ? getInitials(user.name) : "U";

	return (
		<div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-8 md:py-10">
			<div className="mb-6 flex items-center gap-2">
				<CircleMinus className="h-6 w-6 text-[#af2525]" strokeWidth={2} />
				<h1 className="text-[22px] font-semibold text-black md:text-[26px]">
					Profile
				</h1>
			</div>

			<div className="overflow-hidden rounded-[14px]">
				<AvatarRow
					currentPhoto={user.photo}
					initials={initials}
					onSave={(photo) => save({ photo })}
				/>

				<ProfileRow
					icon={<User size={20} strokeWidth={1.75} />}
					label="Name"
					value={user.name}
					isOpen={openRow === "name"}
					onToggle={() => toggle("name")}
				>
					<NameEditor
						current={user.name}
						onSave={(name) => save({ name })}
						disabled={saving}
					/>
				</ProfileRow>

				<ProfileRow
					icon={<GenderIcon size={20} />}
					label="Gender"
					value={user.gender ? GENDER_LABELS[user.gender] : null}
					isOpen={openRow === "gender"}
					onToggle={() => toggle("gender")}
				>
					<GenderEditor
						current={user.gender ?? null}
						onSave={(gender) => save({ gender })}
						disabled={saving}
					/>
				</ProfileRow>

				<ProfileRow
					icon={<Mail size={20} strokeWidth={1.75} />}
					label="Email"
					value={user.email}
					isOpen={openRow === "email"}
					onToggle={() => toggle("email")}
					actionMode="edit"
				>
					<p className="px-1 text-[13px] text-black/50">
						Email changes require verification and are not available yet.
					</p>
				</ProfileRow>

				<ProfileRow
					icon={<Phone size={20} strokeWidth={1.75} />}
					label="Phone Number"
					value={user.phone ?? "Add phone number"}
					isOpen={openRow === "phone"}
					onToggle={() => toggle("phone")}
				>
					<SimpleEditor
						current={user.phone ?? ""}
						placeholder="+234 801 234 5678"
						type="tel"
						onSave={(phone) => save({ phone })}
						disabled={saving}
					/>
				</ProfileRow>

				<ProfileRow
					icon={<MapPin size={20} strokeWidth={1.75} />}
					label="Address"
					value={user.address}
					isOpen={openRow === "address"}
					onToggle={() => toggle("address")}
				>
					<SimpleEditor
						current={user.address}
						placeholder="Street, City, State"
						onSave={(address) => save({ address })}
						disabled={saving}
					/>
				</ProfileRow>

				<ProfileRow
					icon={<SettingsIcon size={20} strokeWidth={1.75} />}
					label="Account Setting"
					value="Manage your account preferences"
					isOpen={false}
					onToggle={() => router.push("/settings")}
					actionMode="edit"
				/>
			</div>
		</div>
	);
}
