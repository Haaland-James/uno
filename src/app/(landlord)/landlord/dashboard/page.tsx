import { Building2, Eye, MessageSquare, TrendingUp } from "lucide-react";

export default function DashboardPage() {
	const stats = [
		{ label: "Active Listings", value: "4", icon: Building2, trend: "+1 this week" },
		{ label: "Total Views", value: "1,247", icon: Eye, trend: "+18% vs last month" },
		{ label: "Enquiries", value: "23", icon: MessageSquare, trend: "3 unread" },
		{ label: "Response Rate", value: "92%", icon: TrendingUp, trend: "Excellent" },
	];

	return (
		<div className="page-container py-4 md:py-6">
			<h1 className="text-heading-2 text-content-primary mb-1">Dashboard</h1>
			<p className="text-small text-content-secondary mb-6">
				Overview of your property listings
			</p>

			{/* Stats Grid */}
			<div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
				{stats.map((stat) => (
					<div key={stat.label} className="card-uno">
						<div className="flex items-center gap-2 mb-2">
							<div className="h-8 w-8 rounded-lg bg-uno-red-50 flex items-center justify-center">
								<stat.icon className="h-4 w-4 text-uno-red" />
							</div>
						</div>
						<div className="text-heading-2 text-content-primary">{stat.value}</div>
						<div className="text-small text-content-secondary">{stat.label}</div>
						<div className="text-tiny text-verified mt-1">{stat.trend}</div>
					</div>
				))}
			</div>

			{/* Placeholder for recent activity */}
			<div className="card-uno">
				<h2 className="text-heading-3 text-content-primary mb-3">Recent Activity</h2>
				<p className="text-body text-content-secondary">
					Dashboard details will be fully implemented in a future phase.
				</p>
			</div>
		</div>
	);
}
