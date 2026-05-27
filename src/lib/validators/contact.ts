import { z } from "zod";

export const contactCreateSchema = z.object({
	propertyId: z.string().min(1, "propertyId is required"),
	contactMethod: z.enum(["WHATSAPP", "PHONE", "EMAIL"]),
	message: z.string().max(1000).optional(),
	source: z.string().max(40).optional(),
});

export const contactStatusSchema = z.object({
	status: z.enum(["READ", "RESPONDED", "ARCHIVED", "UNREAD"]),
});

export const contactListQuerySchema = z.object({
	status: z.enum(["UNREAD", "READ", "RESPONDED", "ARCHIVED", "ALL"]).optional(),
	cursor: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactStatusInput = z.infer<typeof contactStatusSchema>;
export type ContactListQueryInput = z.infer<typeof contactListQuerySchema>;
