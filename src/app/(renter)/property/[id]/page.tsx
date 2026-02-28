import { ArrowLeft, Share2, Heart, MapPin, BedDouble, Bath, BadgeCheck, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

export default function PropertyDetailPage({
	params,
}: {
	params: { id: string };
}) {
	return (
		<div className="max-w-3xl mx-auto">
			{/* Top Bar */}
			<div className="sticky top-14 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-page-mobile py-3 flex items-center justify-between">
				<Link href="/feed" className="touch-target flex items-center gap-2 text-content-secondary">
					<ArrowLeft className="h-5 w-5" />
					<span className="text-small font-medium">Back</span>
				</Link>
				<div className="flex items-center gap-2">
					<button className="touch-target flex items-center justify-center">
						<Share2 className="h-5 w-5 text-content-secondary" />
					</button>
					<button className="touch-target flex items-center justify-center">
						<Heart className="h-5 w-5 text-content-secondary" />
					</button>
				</div>
			</div>

			{/* Image Carousel Placeholder */}
			<div className="aspect-[16/10] bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
				<p className="text-content-muted">Property Images — ID: {params.id}</p>
			</div>

			{/* Content */}
			<div className="page-container py-6 space-y-6">
				{/* Price & Badge */}
				<div className="flex items-start justify-between">
					<div>
						<div className="price-display text-heading-1">₦350,000/yr</div>
						<p className="text-small text-content-secondary mt-1">2 Bedroom Flat</p>
					</div>
					<div className="badge-verified">
						<BadgeCheck className="h-4 w-4" />
						<span>Verified</span>
					</div>
				</div>

				{/* Location */}
				<div className="flex items-center gap-1.5 text-body text-content-secondary">
					<MapPin className="h-4 w-4 flex-shrink-0" />
					<span>Independence Layout, Uyo</span>
				</div>

				{/* Details Grid */}
				<div className="grid grid-cols-2 gap-3">
					<div className="card-uno flex items-center gap-3">
						<BedDouble className="h-5 w-5 text-uno-red" />
						<div>
							<div className="text-small font-semibold">2 Bedrooms</div>
							<div className="text-tiny text-content-muted">Rooms</div>
						</div>
					</div>
					<div className="card-uno flex items-center gap-3">
						<Bath className="h-5 w-5 text-uno-red" />
						<div>
							<div className="text-small font-semibold">2 Bathrooms</div>
							<div className="text-tiny text-content-muted">Baths</div>
						</div>
					</div>
				</div>

				{/* Description Placeholder */}
				<div>
					<h2 className="text-heading-3 text-content-primary mb-2">Description</h2>
					<p className="text-body text-content-secondary">
						Property detail view will be fully implemented in a future phase.
						This is a placeholder for property ID: {params.id}
					</p>
				</div>

				{/* Contact CTA */}
				<div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-page-mobile py-3 flex gap-3">
					<button className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
						<MessageCircle className="h-5 w-5" />
						WhatsApp
					</button>
					<button className="btn-secondary flex items-center justify-center gap-2 px-6 py-3">
						<Phone className="h-5 w-5" />
						Call
					</button>
				</div>
			</div>
		</div>
	);
}
