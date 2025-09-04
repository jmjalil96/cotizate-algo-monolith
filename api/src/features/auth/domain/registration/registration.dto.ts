import { z } from "zod";
import { OTP_LENGTH } from "../../shared/constants/registration.constants.js";

/**
 * Registration DTO - Request/Response schemas for /register and /verify-email endpoints
 */

// ============================================
// REQUEST SCHEMA
// ============================================

/**
 * POST /register request body validation
 */
export const registerRequestSchema = z.object({
	// User information
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(50, "First name must be less than 50 characters")
		.trim(),

	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(50, "Last name must be less than 50 characters")
		.trim(),

	email: z
		.string()
		.email("Invalid email format")
		.toLowerCase() // Normalize to lowercase
		.trim(),

	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be less than 128 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),

	// Organization information
	organizationName: z
		.string()
		.min(2, "Organization name must be at least 2 characters")
		.max(100, "Organization name must be less than 100 characters")
		.trim(),
});

/**
 * POST /verify-email request body validation
 */
export const verifyEmailRequestSchema = z.object({
	email: z.string().email("Invalid email format").toLowerCase().trim(),

	otpCode: z
		.string()
		.length(OTP_LENGTH, `OTP code must be exactly ${OTP_LENGTH} digits`)
		.regex(/^\d+$/, "OTP code must contain only digits"),
});

/**
 * POST /resend-code request body validation
 */
export const resendCodeRequestSchema = z.object({
	email: z.string().email("Invalid email format").toLowerCase().trim(),
});

// ============================================
// RESPONSE SCHEMA
// ============================================

/**
 * POST /register response body (201 Created)
 */
export const registerResponseSchema = z.object({
	sessionToken: z.string().uuid(),
	otpExpiresAt: z.string().datetime(),
});

/**
 * POST /verify-email response body (200 OK)
 */
export const verifyEmailResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

/**
 * POST /resend-code response body (200 OK)
 */
export const resendCodeResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	otpExpiresAt: z.string().datetime().optional(),
	waitSeconds: z.number().int().min(0).optional(),
	retryAfter: z.string().datetime().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
export type RegisterResponseDto = z.infer<typeof registerResponseSchema>;
export type VerifyEmailRequestDto = z.infer<typeof verifyEmailRequestSchema>;
export type VerifyEmailResponseDto = z.infer<typeof verifyEmailResponseSchema>;
export type ResendCodeRequestDto = z.infer<typeof resendCodeRequestSchema>;
export type ResendCodeResponseDto = z.infer<typeof resendCodeResponseSchema>;
