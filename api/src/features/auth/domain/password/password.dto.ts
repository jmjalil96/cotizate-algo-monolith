import { z } from "zod";
import { OTP_LENGTH } from "../../shared/constants/registration.constants.js";

/**
 * Password DTO - Request/Response schemas for /forgot-password and /reset-password endpoints
 */

// ============================================
// REQUEST SCHEMA
// ============================================

/**
 * POST /forgot-password request body validation
 */
export const forgotPasswordRequestSchema = z.object({
	email: z.string().email("Invalid email format").toLowerCase().trim(),
});

/**
 * POST /reset-password request body validation
 */
export const resetPasswordRequestSchema = z.object({
	email: z.string().email("Invalid email format").toLowerCase().trim(),

	otpCode: z
		.string()
		.length(OTP_LENGTH, `OTP code must be exactly ${OTP_LENGTH} digits`)
		.regex(/^\d+$/, "OTP code must contain only digits"),

	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be less than 128 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * POST /change-password request body validation
 */
export const changePasswordRequestSchema = z.object({
	currentPassword: z
		.string()
		.min(1, "Current password is required")
		.max(128, "Current password must be less than 128 characters"),

	newPassword: z
		.string()
		.min(8, "New password must be at least 8 characters")
		.max(128, "New password must be less than 128 characters")
		.regex(/[A-Z]/, "New password must contain at least one uppercase letter")
		.regex(/[a-z]/, "New password must contain at least one lowercase letter")
		.regex(/[0-9]/, "New password must contain at least one number"),
});

// ============================================
// RESPONSE SCHEMA
// ============================================

/**
 * POST /forgot-password response body (200 OK)
 */
export const forgotPasswordResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	otpExpiresAt: z.string().datetime().optional(),
});

/**
 * POST /reset-password response body (200 OK)
 */
export const resetPasswordResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

/**
 * POST /change-password response body (200 OK)
 */
export const changePasswordResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordResponseDto = z.infer<typeof forgotPasswordResponseSchema>;
export type ResetPasswordRequestDto = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordResponseDto = z.infer<typeof resetPasswordResponseSchema>;
export type ChangePasswordRequestDto = z.infer<typeof changePasswordRequestSchema>;
export type ChangePasswordResponseDto = z.infer<typeof changePasswordResponseSchema>;
