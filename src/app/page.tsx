import Link from "next/link";
import { Search, BadgeCheck, Building2, ArrowRight } from "lucide-react";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";

export default function HomePage() {
	return (
		<>
			<GuestHeader />
			<main>
				<div className="min-h-screen">
					{/* Hero Section */}
					<section className="relative bg-gradient-to-br from-uno-red-900 via-uno-red to-uno-red-light overflow-hidden">
						{/* Background Pattern */}
						<div className="absolute inset-0 opacity-10">
							<div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-white" />
							<div className="absolute bottom-20 right-20 h-48 w-48 rounded-full bg-white" />
							<div className="absolute top-1/2 left-1/3 h-24 w-24 rounded-full bg-white" />
						</div>

						<div className="page-container relative py-16 md:py-24 lg:py-32">
							<div className="max-w-2xl">
								<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-tiny font-medium mb-6">
									<BadgeCheck className="h-3.5 w-3.5" />
									<span>Verified Properties Only</span>
								</div>

								<h1 className="text-[2rem] md:text-[3rem] lg:text-[3.5rem] font-extrabold text-white leading-tight mb-4">
									Find Your Next Home{" "}
									<span className="text-white/80">in Uyo</span>
								</h1>

								<p className="text-white/80 text-body md:text-lg mb-8 max-w-lg">
									Making House Hunting Simple, Verified, and Transparent.
									Browse verified rental properties with real photos and honest pricing.
								</p>

								{/* Search Bar */}
								<div className="flex flex-col sm:flex-row gap-3 mb-8">
									<div className="relative flex-1">
										<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted" />
										<input
											type="text"
											placeholder="Search by area e.g. Ewet Housing..."
											className="w-full h-12 md:h-14 pl-12 pr-4 bg-white rounded-button text-body outline-none focus:ring-2 focus:ring-white/30"
										/>
									</div>
									<Link
										href="/feed"
										className="btn-primary flex items-center justify-center gap-2 px-8 h-12 md:h-14 bg-content-primary text-white hover:bg-gray-800 rounded-button"
									>
										<span className="font-semibold">Search</span>
										<ArrowRight className="h-4 w-4" />
									</Link>
								</div>

								{/* Quick Stats */}
								<div className="flex gap-8 text-white/90">
									<div>
										<div className="text-heading-2 font-bold">200+</div>
										<div className="text-tiny text-white/60">Verified Listings</div>
									</div>
									<div>
										<div className="text-heading-2 font-bold">50+</div>
										<div className="text-tiny text-white/60">Trusted Landlords</div>
									</div>
									<div>
										<div className="text-heading-2 font-bold">18</div>
										<div className="text-tiny text-white/60">Areas in Uyo</div>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* How It Works */}
					<section className="page-container py-section-gap">
						<h2 className="text-heading-2 text-content-primary text-center mb-2">
							How UNO Works
						</h2>
						<p className="text-body text-content-secondary text-center mb-10 max-w-md mx-auto">
							Finding your next home shouldn&apos;t be stressful. Here&apos;s how we make it simple.
						</p>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{[
								{
									step: "1",
									title: "Browse Verified Listings",
									description:
										"Every property is verified with real photos and honest pricing. No surprises.",
									icon: Search,
								},
								{
									step: "2",
									title: "Contact Landlord Directly",
									description:
										"Reach out via WhatsApp, phone call, or email. No middlemen, no hidden fees.",
									icon: Building2,
								},
								{
									step: "3",
									title: "Move In With Confidence",
									description:
										"Verified properties, transparent pricing, and trusted landlords. Peace of mind.",
									icon: BadgeCheck,
								},
							].map((item) => (
								<div key={item.step} className="card-uno text-center group">
									<div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-uno-red-50 text-uno-red mx-auto mb-4 group-hover:bg-uno-red group-hover:text-white transition-colors duration-300">
										<item.icon className="h-6 w-6" />
									</div>
									<div className="text-tiny text-uno-red font-bold mb-1">
										Step {item.step}
									</div>
									<h3 className="text-heading-3 text-content-primary mb-2">
										{item.title}
									</h3>
									<p className="text-small text-content-secondary">
										{item.description}
									</p>
								</div>
							))}
						</div>
					</section>

					{/* CTA Section */}
					<section className="bg-content-primary">
						<div className="page-container py-section-gap text-center">
							<h2 className="text-heading-2 text-white mb-3">
								Are You a Landlord?
							</h2>
							<p className="text-body text-white/70 mb-8 max-w-md mx-auto">
								List your property for free and reach thousands of verified tenants
								in Uyo. Get real enquiries, not time wasters.
							</p>
							<div className="flex flex-col sm:flex-row gap-3 justify-center">
								<Link
									href="/properties/new"
									className="btn-primary px-8 py-3 flex items-center justify-center gap-2 text-body"
								>
									<Building2 className="h-5 w-5" />
									List Your Property
								</Link>
								<Link
									href="/feed"
									className="px-8 py-3 rounded-button border border-white/30 text-white hover:bg-white/10 font-semibold transition-colors text-body text-center"
								>
									Browse Properties
								</Link>
							</div>
						</div>
					</section>
				</div>
			</main>
			<Footer />
			<MobileNav />
		</>
	);
}
