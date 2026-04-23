export type Role = "RENTER" | "LANDLORD" | "AGENT" | "ADMIN";

export type LandlordType = "INDIVIDUAL" | "PROPERTY_MANAGER" | "AGENT";

export type VerificationLevel = "BASIC" | "ADVANCED" | "PREMIUM";

export type ContactMethod = "WHATSAPP" | "PHONE" | "EMAIL";

export type ContactStatus = "UNREAD" | "READ" | "RESPONDED" | "ARCHIVED";

export type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";

export interface User {
	id: string;
	phone: string;
	phoneVerified: boolean;
	email?: string | null;
	emailVerified: boolean;
	name?: string | null;
	photo?: string | null;
	gender?: Gender | null;
	address?: string | null;
	role: Role;
	createdAt: Date;
	updatedAt: Date;
}

export interface LandlordProfile {
	id: string;
	userId: string;
	whatsappNumber?: string | null;
	bio?: string | null;
	landlordType: LandlordType;
	idVerified: boolean;
	verificationLevel: VerificationLevel;
	contactMethod: ContactMethod;
	availableDays: string[];
	availableHoursStart?: string | null;
	availableHoursEnd?: string | null;
	totalProperties: number;
	responseRate: number;
	avgResponseTime?: number | null;
}

export interface ContactRequest {
	id: string;
	propertyId: string;
	tenantId: string;
	tenantName: string;
	tenantPhone: string;
	tenantEmail?: string | null;
	message?: string | null;
	contactMethod: ContactMethod;
	status: ContactStatus;
	readAt?: Date | null;
	respondedAt?: Date | null;
	source?: string | null;
	createdAt: Date;
}

export type NotificationChannel = "email" | "push" | "whatsapp";
export type NotificationFrequency = "never" | "instant" | "daily" | "weekly";

export interface SavedSearch {
	id: string;
	userId: string;
	name: string;
	searchType: string;
	criteria: Record<string, unknown>;
	isActive: boolean;
	notificationsEnabled: boolean;
	notificationChannels: NotificationChannel[];
	notificationFrequency: NotificationFrequency;
	newResultsCount: number;
	createdAt: Date;
	updatedAt: Date;
}
