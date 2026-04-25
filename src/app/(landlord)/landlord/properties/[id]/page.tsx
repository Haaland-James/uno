export default function PropertyManagePage({
	params,
}: {
	params: { id: string };
}) {
	return (
		<div className="page-container py-4 md:py-6 max-w-2xl mx-auto">
			<h1 className="text-heading-2 text-content-primary mb-1">Edit Property</h1>
			<p className="text-small text-content-secondary mb-6">
				Property ID: {params.id}
			</p>

			<div className="card-uno">
				<p className="text-body text-content-secondary text-center py-8">
					Property management view will be fully implemented in a future phase.
				</p>
			</div>
		</div>
	);
}
