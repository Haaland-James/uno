import Link from "next/link";

export default function SignupPage() {
	return (
		<div className="min-h-screen flex items-center justify-center px-page-mobile">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<h1 className="text-heading-1 text-uno-red font-extrabold mb-2">UNO</h1>
					<p className="text-body text-content-secondary">
						Create your account to start finding your next home.
					</p>
				</div>

				<div className="card-uno space-y-4">
					<div>
						<label className="block text-small font-medium text-content-primary mb-1.5">
							Full Name
						</label>
						<input type="text" placeholder="Enter your full name" className="input-uno" />
					</div>

					<div>
						<label className="block text-small font-medium text-content-primary mb-1.5">
							Phone Number
						</label>
						<input type="tel" placeholder="e.g. 0801 234 5678" className="input-uno" />
					</div>

					<div>
						<label className="block text-small font-medium text-content-primary mb-1.5">
							I am a
						</label>
						<div className="grid grid-cols-2 gap-3">
							<button className="py-3 rounded-button border-2 border-uno-red bg-uno-red-50 text-uno-red font-semibold text-small">
								Renter
							</button>
							<button className="py-3 rounded-button border-2 border-gray-200 text-content-secondary font-semibold text-small hover:border-gray-300">
								Landlord
							</button>
						</div>
					</div>

					<button className="btn-primary w-full py-3 text-body">
						Create Account
					</button>

					<p className="text-center text-small text-content-secondary">
						Already have an account?{" "}
						<Link href="/login" className="text-uno-red font-semibold hover:underline">
							Sign In
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
