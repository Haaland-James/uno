import { Bell } from "lucide-react";

export default function SavedSearchesPage() {
	return (
		<div className="page-container py-4 md:py-6">
			<h1 className="text-heading-2 text-content-primary mb-1">Saved Searches</h1>
			<p className="text-small text-content-secondary mb-6">
				Get notified when new properties match your criteria
			</p>

			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="h-16 w-16 rounded-full bg-uno-red-50 flex items-center justify-center mb-4">
					<Bell className="h-8 w-8 text-uno-red" />
				</div>
				<h3 className="text-heading-3 text-content-primary mb-2">
					No saved searches yet
				</h3>
				<p className="text-body text-content-secondary max-w-sm">
					Save your search criteria to get instant alerts when new matching properties are listed.
				</p>
			</div>
		</div>
	);
}
