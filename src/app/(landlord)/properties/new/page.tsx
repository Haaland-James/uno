export default function NewPropertyPage() {
	return (
		<div className="page-container py-4 md:py-6 max-w-2xl mx-auto">
			<h1 className="text-heading-2 text-content-primary mb-1">List a Property</h1>
			<p className="text-small text-content-secondary mb-6">
				Fill in the details below to list your property.
			</p>

			{/* Step Indicator */}
			<div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
				{["Basic Info", "Details", "Amenities", "Photos", "Location", "Pricing", "Review"].map((step, i) => (
					<div key={step} className="flex items-center gap-2 whitespace-nowrap">
						<div className={`h-7 w-7 rounded-full flex items-center justify-center text-tiny font-bold ${i === 0 ? "bg-uno-red text-white" : "bg-surface-tertiary text-content-muted"
							}`}>
							{i + 1}
						</div>
						<span className={`text-tiny font-medium ${i === 0 ? "text-uno-red" : "text-content-muted"
							}`}>
							{step}
						</span>
						{i < 6 && <div className="h-px w-4 bg-gray-200" />}
					</div>
				))}
			</div>

			{/* Form Placeholder */}
			<div className="card-uno">
				<p className="text-body text-content-secondary text-center py-8">
					The 7-step property listing form will be fully implemented in a future phase.
				</p>
			</div>
		</div>
	);
}
