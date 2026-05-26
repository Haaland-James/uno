import type { ReactNode } from "react";

/**
 * Page header used on every admin page. Title, optional description, optional
 * actions on the right. Keep visuals identical across pages — never customise
 * inline; if you need a variant, add it here.
 */
export function AdminPageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-wrap items-start justify-between gap-3">
			<div className="min-w-0">
				<h1 className="text-heading-2 text-content-primary mb-1">{title}</h1>
				{description && (
					<p className="text-small text-content-secondary">{description}</p>
				)}
			</div>
			{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
		</div>
	);
}
