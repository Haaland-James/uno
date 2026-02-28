import Link from "next/link";
import { Plus, Building2 } from "lucide-react";

export default function PropertiesPage() {
	return (
		<div className="page-container py-4 md:py-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-heading-2 text-content-primary">My Properties</h1>
					<p className="text-small text-content-secondary">Manage your property listings</p>
				</div>
				<Link href="/properties/new" className="btn-primary flex items-center gap-2 px-4 py-2 text-small">
					<Plus className="h-4 w-4" />
					<span>Add New</span>
				</Link>
			</div>

			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="h-16 w-16 rounded-full bg-uno-red-50 flex items-center justify-center mb-4">
					<Building2 className="h-8 w-8 text-uno-red" />
				</div>
				<h3 className="text-heading-3 text-content-primary mb-2">No properties yet</h3>
				<p className="text-body text-content-secondary max-w-sm mb-6">
					List your first property and start receiving enquiries from verified tenants.
				</p>
				<Link href="/properties/new" className="btn-primary px-6 py-2.5">
					List Your First Property
				</Link>
			</div>
		</div>
	);
}
