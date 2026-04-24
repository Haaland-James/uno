import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  purpose: z.enum(["SIGNUP", "LOGIN"]),
  // Required only for SIGNUP
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  purpose: z.enum(["SIGNUP", "LOGIN"]),
  // Carried from signup form, only used when purpose === "SIGNUP"
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
