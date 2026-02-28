import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY } from "@/../../config/constants";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format a number as Nigerian Naira currency
 * @example formatNaira(350000) => "₦350,000"
 * @example formatNaira(1500000) => "₦1,500,000"
 */
export function formatNaira(amount: number): string {
	return new Intl.NumberFormat(CURRENCY.locale, {
		style: "currency",
		currency: CURRENCY.code,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

/**
 * Format price with rent period
 * @example formatRentPrice(350000, "YEAR") => "₦350,000/yr"
 */
export function formatRentPrice(
	amount: number,
	period: "YEAR" | "MONTH" = "YEAR"
): string {
	const formatted = formatNaira(amount);
	return `${formatted}/${period === "YEAR" ? "yr" : "mo"}`;
}

/**
 * Format Nigerian phone number
 * @example formatPhone("08012345678") => "+234 801 234 5678"
 */
export function formatPhone(phone: string): string {
	const cleaned = phone.replace(/\D/g, "");
	if (cleaned.startsWith("234")) {
		const local = cleaned.slice(3);
		return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
	}
	if (cleaned.startsWith("0")) {
		const local = cleaned.slice(1);
		return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
	}
	return phone;
}

/**
 * Generate WhatsApp link
 */
export function getWhatsAppLink(phone: string, message?: string): string {
	const cleaned = phone.replace(/\D/g, "");
	const number = cleaned.startsWith("0") ? `234${cleaned.slice(1)}` : cleaned;
	const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
	return `https://wa.me/${number}${encodedMessage}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Generate property slug from title and id
 */
export function generatePropertySlug(title: string, id: string): string {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	return `${slug}-${id.slice(-6)}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
	return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

/**
 * Format number compactly
 * @example formatCompact(1500) => "1.5K"
 */
export function formatCompact(num: number): string {
	if (num < 1000) return num.toString();
	if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
	return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}
