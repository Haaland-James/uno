import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Mail, Phone, Clock } from "lucide-react";
import { siteConfig } from "@/../config/site";
import {
	isPlaceholder,
	resolve,
	supportMailto,
	supportTelLink,
	supportWhatsAppLink,
	SOCIAL_CHANNELS,
} from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { FacebookIcon } from "@/components/icons/FacebookIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { XIcon } from "@/components/icons/XIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";

export const metadata: Metadata = {
	title: "Contact us",
	description: `Reach the ${siteConfig.name} team on WhatsApp, by phone or by email.`,
};

const BRAND = siteConfig.name;

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const SOCIAL_ICONS: Record<(typeof SOCIAL_CHANNELS)[number]["key"], IconType> = {
	instagram: InstagramIcon,
	whatsapp: WhatsAppIcon,
	facebook: FacebookIcon,
	tiktok: TikTokIcon,
	x: XIcon,
	linkedin: LinkedInIcon,
};

function ChannelCard({
	icon,
	label,
	value,
	href,
	note,
	accent,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	href: string;
	note?: string;
	accent?: boolean;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex min-h-[44px] flex-col rounded-card-lg border border-black/10 bg-white p-5 transition-colors hover:border-black/25"
		>
			<span
				className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${
					accent ? "bg-[#25D366]/10 text-[#25D366]" : "bg-uno-red/10 text-uno-red"
				}`}
			>
				{icon}
			</span>
			<span className="text-[13px] font-medium text-content-secondary">{label}</span>
			<span className="mt-0.5 break-words text-[16px] font-semibold text-content-primary group-hover:text-uno-red">
				{value}
			</span>
			{note && (
				<span className="mt-1 text-[13px] text-content-secondary">{note}</span>
			)}
		</a>
	);
}

export default function ContactPage() {
	const email = resolve(siteConfig.support.email);
	const phone = resolve(siteConfig.support.phone);
	const whatsapp = resolve(siteConfig.support.whatsapp);

	// A channel with an unfilled TODO in config isn't shown at all. A card
	// linking to nothing is worse than one fewer card.
	const channels = [
		!isPlaceholder(siteConfig.support.whatsapp) && {
			key: "whatsapp",
			icon: <WhatsAppIcon size={20} />,
			label: "WhatsApp",
			value: phone || whatsapp,
			href: supportWhatsAppLink(`Hi ${BRAND}, I need some help.`),
			note: "Usually the fastest way to reach us.",
			accent: true,
		},
		!isPlaceholder(siteConfig.support.phone) && {
			key: "phone",
			icon: <Phone size={20} />,
			label: "Phone",
			value: phone,
			href: supportTelLink(),
		},
		!isPlaceholder(siteConfig.support.email) && {
			key: "email",
			icon: <Mail size={20} />,
			label: "Email",
			value: email,
			href: supportMailto(`${BRAND} support`),
			note: "Best for anything that needs a paper trail.",
		},
	].filter(Boolean) as Array<{
		key: string;
		icon: React.ReactNode;
		label: string;
		value: string;
		href: string;
		note?: string;
		accent?: boolean;
	}>;

	const socials = SOCIAL_CHANNELS.filter(
		(channel) => !isPlaceholder(siteConfig.socials[channel.key])
	);

	return (
		<div className="page-container py-8 md:py-14">
			<header className="max-w-[60ch]">
				<h1 className="text-[28px] font-semibold leading-tight text-content-primary md:text-[40px]">
					Contact us
				</h1>
				<p className="mt-3 text-[15px] leading-[1.7] text-content-secondary">
					Talk to a person. There is no contact form here on purpose &mdash;
					message us on the channel that suits you and we will reply on it.
				</p>
			</header>

			{channels.length > 0 ? (
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{channels.map(({ key, ...rest }) => (
						<ChannelCard key={key} {...rest} />
					))}
				</div>
			) : (
				<p className="mt-8 text-[15px] text-content-secondary">
					Our support channels are being set up. Please check back shortly.
				</p>
			)}

			<div className="mt-6 inline-flex items-center gap-2 rounded-card-sm bg-bg-subtle px-4 py-3 text-[14px] text-content-secondary">
				<Clock size={16} className="shrink-0" />
				<span>{siteConfig.support.hours}</span>
			</div>

			{socials.length > 0 && (
				<section className="mt-12 border-t border-black/10 pt-8">
					<h2 className="text-[18px] font-semibold text-content-primary">
						Follow {BRAND}
					</h2>
					<p className="mt-1 max-w-[60ch] text-[14px] leading-[1.7] text-content-secondary">
						These are our only official accounts. If an account claims to be us and
						is not listed here, it is not us &mdash; please{" "}
						<Link
							href="/terms#official-channels"
							className="font-medium text-uno-red underline underline-offset-2"
						>
							report it
						</Link>
						.
					</p>
					<ul className="mt-5 flex flex-wrap gap-3">
						{socials.map((channel) => {
							const Icon = SOCIAL_ICONS[channel.key];
							return (
								<li key={channel.key}>
									<a
										href={resolve(siteConfig.socials[channel.key])}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={`${BRAND} on ${channel.label}`}
										className="flex min-h-[44px] items-center gap-2 rounded-full border border-black/10 px-4 text-[14px] font-medium text-content-primary transition-colors hover:border-black/25 hover:text-uno-red"
									>
										<Icon size={18} />
										{channel.label}
									</a>
								</li>
							);
						})}
					</ul>
				</section>
			)}

			<section className="mt-12 border-t border-black/10 pt-8">
				<h2 className="text-[18px] font-semibold text-content-primary">
					A few things we cannot help with
				</h2>
				<ul className="mt-3 max-w-[60ch] list-disc space-y-2 pl-5 text-[15px] leading-[1.7] text-content-secondary">
					<li>
						<strong className="font-semibold text-content-primary">
							Payments and deposits.
						</strong>{" "}
						{BRAND} never collects rent, fees or deposits, and never holds money on
						anyone&rsquo;s behalf. If someone asks you to pay us, it is a scam
						&mdash; tell us and we will investigate.
					</li>
					<li>
						<strong className="font-semibold text-content-primary">
							Negotiating on your behalf.
						</strong>{" "}
						We introduce you to the lister; what you agree with them is between
						you and them.
					</li>
					<li>
						<strong className="font-semibold text-content-primary">
							Reporting a listing.
						</strong>{" "}
						Faster from the listing itself &mdash; use the report option there so
						it reaches our moderation queue with the property already attached.
					</li>
				</ul>
			</section>
		</div>
	);
}
