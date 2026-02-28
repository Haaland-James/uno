import { Search } from "lucide-react";
import Link from "next/link";
import { LOCATIONS, PROPERTY_TYPES } from "@/../config/constants";

export default function SearchPage() {
	const uyoAreas = LOCATIONS["Uyo"];

	return (
		<div className="page-container py-4 md:py-6">
			<h1 className="text-heading-2 text-content-primary mb-6">Search</h1>

			{/* Search Input */}
			<div className="relative mb-6">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted" />
				<input
					type="text"
					placeholder="Search by area, type, or keyword..."
					className="input-uno pl-12 h-12"
				/>
			</div>

			{/* Popular Areas */}
			<div className="mb-8">
				<h2 className="text-heading-3 text-content-primary mb-3">Popular Areas in Uyo</h2>
				<div className="flex flex-wrap gap-2">
					{uyoAreas.map((area) => (
						<Link
							key={area}
							href={`/feed?area=${encodeURIComponent(area)}`}
							className="px-3 py-2 rounded-full border border-gray-200 text-small text-content-secondary hover:border-uno-red hover:text-uno-red transition-colors"
						>
							{area}
						</Link>
					))}
				</div>
			</div>

			{/* Property Types */}
			<div>
				<h2 className="text-heading-3 text-content-primary mb-3">Property Types</h2>
				<div className="grid grid-cols-2 gap-3">
					{PROPERTY_TYPES.map((type) => (
						<Link
							key={type.value}
							href={`/feed?type=${type.value}`}
							className="card-uno flex items-center gap-3 hover:border-uno-red/30 transition-colors"
						>
							<div className="h-10 w-10 rounded-xl bg-uno-red-50 flex items-center justify-center">
								<span className="text-uno-red text-small font-bold">
									{type.label[0]}
								</span>
							</div>
							<span className="text-body font-medium text-content-primary">
								{type.label}
							</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
