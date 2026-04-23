"use client";

import { Home } from "lucide-react";

export default function MyHousePage() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fce4f1]">
				<Home className="h-8 w-8 text-[#dd6bb1]" strokeWidth={2} />
			</div>
			<h1 className="mt-4 text-[22px] font-semibold text-black">My House</h1>
			<p className="mt-2 max-w-sm text-[15px] text-black/60">
				Once you move in to a home rented through UNO, you&apos;ll find it here.
			</p>
		</div>
	);
}
