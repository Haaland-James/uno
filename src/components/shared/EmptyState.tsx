import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description?: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-16 px-6 text-center",
				className
			)}
		>
			{icon && (
				<div className="mb-4 text-content-muted">{icon}</div>
			)}
			<h3 className="text-heading-3 text-content-primary mb-2">{title}</h3>
			{description && (
				<p className="text-body text-content-secondary max-w-sm mb-6">
					{description}
				</p>
			)}
			{action && <div>{action}</div>}
		</div>
	);
}
