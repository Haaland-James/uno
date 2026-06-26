import { z } from "zod";

// Nigerian phone number regex — supports 080, 081, 070, 090, 091, +234
const nigerianPhoneRegex = /^(\+?234|0)(70|80|81|90|91|71)\d{8}$/;

export const loginSchema = z.object({
	phone: z
		.string()
		.regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number"),
});

export const signupSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(100, "Name must be less than 100 characters"),
	phone: z
		.string()
		.regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number"),
	email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
	role: z.enum(["RENTER", "LANDLORD"]).default("RENTER"),
});

export const profileUpdateSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	phone: z.string().regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number").optional().or(z.literal("")),
	gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]).optional().nullable(),
	address: z.string().max(300).optional().or(z.literal("")),
	photo: z.string().url().optional().or(z.literal("")),
	language: z.string().min(2).max(10).optional(),
});

export const setPasswordSchema = z.object({
	currentPassword: z.string().min(1).optional(),
	newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const notificationPrefsSchema = z.object({
	notifyNewProperties: z.boolean().optional(),
	notifyPriceDrops: z.boolean().optional(),
	notifyWeeklyDigest: z.boolean().optional(),
});

export const landlordProfileSchema = z.object({
	whatsappNumber: z
		.string()
		.regex(nigerianPhoneRegex, "Please enter a valid WhatsApp number")
		.optional(),
	bio: z.string().max(500).optional(),
	landlordType: z.enum(["INDIVIDUAL", "PROPERTY_MANAGER", "AGENT"]).default("INDIVIDUAL"),
	contactMethod: z.enum(["WHATSAPP", "PHONE", "EMAIL"]).default("WHATSAPP"),
	availableDays: z.array(z.string()).default([]),
	availableHoursStart: z.string().optional(),
	availableHoursEnd: z.string().optional(),
});

export const contactRequestSchema = z.object({
	propertyId: z.string().min(1),
	tenantName: z.string().min(2, "Name is required"),
	tenantPhone: z
		.string()
		.regex(nigerianPhoneRegex, "Please enter a valid phone number"),
	tenantEmail: z.string().email().optional().or(z.literal("")),
	message: z.string().max(500).optional(),
	contactMethod: z.enum(["WHATSAPP", "PHONE", "EMAIL"]).default("WHATSAPP"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;
export type LandlordProfileInput = z.infer<typeof landlordProfileSchema>;
export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
