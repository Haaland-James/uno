import Link from "next/link";

export function Footer() {
	return (
		<footer className="hidden md:block border-t border-gray-100 bg-surface-secondary">
			<div className="page-container py-section-padding">
				{/* Top Section */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
					{/* Brand */}
					<div className="md:col-span-1">
						<span className="text-heading-2 font-extrabold text-uno-red">
							UNO
						</span>
						<p className="mt-2 text-small text-content-secondary">
							Making House Hunting Simple, Verified, and Transparent.
						</p>
					</div>

					{/* For Renters */}
					<div>
						<h4 className="font-semibold text-content-primary mb-3">
							For Renters
						</h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/feed"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Browse Properties
								</Link>
							</li>
							<li>
								<Link
									href="/search"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Search
								</Link>
							</li>
							<li>
								<Link
									href="/saved-searches"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Saved Searches
								</Link>
							</li>
							<li>
								<Link
									href="/favourites"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Favourites
								</Link>
							</li>
						</ul>
					</div>

					{/* For Landlords */}
					<div>
						<h4 className="font-semibold text-content-primary mb-3">
							For Landlords
						</h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/properties/new"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									List a Property
								</Link>
							</li>
							<li>
								<Link
									href="/dashboard"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Dashboard
								</Link>
							</li>
							<li>
								<Link
									href="/analytics"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Analytics
								</Link>
							</li>
						</ul>
					</div>

					{/* Company */}
					<div>
						<h4 className="font-semibold text-content-primary mb-3">
							Company
						</h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/about"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									About UNO
								</Link>
							</li>
							<li>
								<Link
									href="/privacy"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link
									href="/terms"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Terms of Service
								</Link>
							</li>
							<li>
								<Link
									href="/contact"
									className="text-small text-content-secondary hover:text-uno-red transition-colors"
								>
									Contact Us
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Legal */}
				<div className="border-t border-gray-200 pt-6">
					<p className="text-tiny text-content-muted text-center">
						UNO is a product of [Company Name], registered with the Corporate
						Affairs Commission (CAC). We comply with the Nigeria Data Protection
						Regulation (NDPR).
					</p>
					<p className="text-tiny text-content-muted text-center mt-1">
						© {new Date().getFullYear()} UNO. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
