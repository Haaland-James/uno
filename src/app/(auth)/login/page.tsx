import Link from "next/link";

export default function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center px-page-mobile">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<h1 className="text-heading-1 text-uno-red font-extrabold mb-2">UNO</h1>
					<p className="text-body text-content-secondary">
						Welcome back! Sign in to continue.
					</p>
				</div>

				<div className="card-uno space-y-4">
					<div>
						<label className="block text-small font-medium text-content-primary mb-1.5">
							Phone Number
						</label>
						<input
							type="tel"
							placeholder="e.g. 0801 234 5678"
							className="input-uno"
						/>
					</div>

					<button className="btn-primary w-full py-3 text-body">
						Send OTP
					</button>

					<p className="text-center text-small text-content-secondary">
						Don&apos;t have an account?{" "}
						<Link href="/signup" className="text-uno-red font-semibold hover:underline">
							Sign Up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
