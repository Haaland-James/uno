import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
	className?: string;
}

function Skeleton({ className }: LoadingSkeletonProps) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-md bg-gray-200",
				className
			)}
		/>
	);
}

export function PropertyCardSkeleton() {
	return (
		<div className="card-uno overflow-hidden">
			{/* Image placeholder */}
			<Skeleton className="h-48 w-full rounded-t-card rounded-b-none -mx-card-padding -mt-card-padding" />

			<div className="pt-3 space-y-3">
				{/* Price */}
				<Skeleton className="h-6 w-32" />

				{/* Title */}
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-3/4" />

				{/* Location */}
				<Skeleton className="h-4 w-48" />

				{/* Amenities */}
				<div className="flex gap-2">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-6 w-24 rounded-full" />
					<Skeleton className="h-6 w-16 rounded-full" />
				</div>
			</div>
		</div>
	);
}

export function FeedSkeleton() {
	return (
		<div className="feed-grid">
			{Array.from({ length: 6 }).map((_, i) => (
				<PropertyCardSkeleton key={i} />
			))}
		</div>
	);
}

export function DetailSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-64 w-full rounded-card" />
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-6 w-full" />
			<Skeleton className="h-6 w-3/4" />
			<div className="grid grid-cols-2 gap-4">
				<Skeleton className="h-20 rounded-card" />
				<Skeleton className="h-20 rounded-card" />
			</div>
		</div>
	);
}

export { Skeleton };
