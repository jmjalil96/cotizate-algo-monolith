import { z } from "zod";

/**
 * Auth schemas recreated from backend API schemas
 * Based on: api/src/features/auth/domain/session/session.dto.ts
 */

// ============================================
// REQUEST SCHEMAS
// ============================================

/**
 * POST /login request body validation
 */
export const loginRequestSchema = z.object({
	email: z.string().email("Invalid email format").toLowerCase().trim(),
	password: z
		.string()
		.min(1, "Password is required")
		.max(128, "Password must be less than 128 characters"),
});

/**
 * POST /logout request body validation
 */
export const logoutRequestSchema = z.object({
	everywhere: z.boolean().optional(),
});

// ============================================
// RESPONSE SCHEMAS
// ============================================

/**
 * POST /login response body (200 OK)
 */
export const loginResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	user: z.object({
		id: z.string().cuid(),
		email: z.string().email(),
		verified: z.boolean(),
		profile: z.object({
			firstName: z.string(),
			lastName: z.string(),
		}),
		organization: z.object({
			id: z.string().cuid(),
			name: z.string(),
			slug: z.string(),
		}),
		permissions: z.array(z.string()),
	}),
	session: z.object({
		id: z.string().cuid(),
		expiresAt: z.string().datetime(),
		lastActivity: z.string().datetime(),
		tokenLastFour: z.string().length(4),
	}),
});

/**
 * POST /logout response body (200 OK)
 */
export const logoutResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	sessionsRevoked: z.number().int().min(0),
});

// ============================================
// TYPE EXPORTS
// ============================================

// ============================================
// REGISTRATION SCHEMAS
// ============================================

/**
 * POST /register request body validation
 */
export const registerRequestSchema = z.object({
	firstName: z
		.string()
		.min(1, "El nombre es requerido")
		.max(50, "El nombre debe tener menos de 50 caracteres")
		.trim(),

	lastName: z
		.string()
		.min(1, "El apellido es requerido")
		.max(50, "El apellido debe tener menos de 50 caracteres")
		.trim(),

	email: z.string().email("Formato de email inválido").toLowerCase().trim(),

	password: z
		.string()
		.min(8, "La contraseña debe tener al menos 8 caracteres")
		.max(128, "La contraseña debe tener menos de 128 caracteres")
		.regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
		.regex(/[a-z]/, "La contraseña debe contener al menos una letra minúscula")
		.regex(/[0-9]/, "La contraseña debe contener al menos un número"),

	organizationName: z
		.string()
		.min(2, "El nombre de la organización debe tener al menos 2 caracteres")
		.max(100, "El nombre de la organización debe tener menos de 100 caracteres")
		.trim(),
});

/**
 * POST /verify-email request body validation
 */
export const verifyEmailRequestSchema = z.object({
	email: z.string().email("Formato de email inválido").toLowerCase().trim(),
	otpCode: z
		.string()
		.length(6, "El código debe tener exactamente 6 dígitos")
		.regex(/^\d+$/, "El código debe contener solo números"),
});

/**
 * POST /resend-code request body validation
 */
export const resendCodeRequestSchema = z.object({
	email: z.string().email("Formato de email inválido").toLowerCase().trim(),
});

// ============================================
// REGISTRATION RESPONSE SCHEMAS
// ============================================

/**
 * POST /register response body (201 Created)
 */
export const registerResponseSchema = z.object({
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
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

// ============================================
// PASSWORD RESET SCHEMAS
// ============================================

/**
 * POST /forgot-password request body validation
 */
export const forgotPasswordRequestSchema = z.object({
	email: z.string().email("Formato de email inválido").toLowerCase().trim(),
});

/**
 * POST /reset-password request body validation
 */
export const resetPasswordRequestSchema = z.object({
	email: z.string().email("Formato de email inválido").toLowerCase().trim(),

	otpCode: z
		.string()
		.length(6, "El código debe tener exactamente 6 dígitos")
		.regex(/^\d+$/, "El código debe contener solo números"),

	newPassword: z
		.string()
		.min(8, "La nueva contraseña debe tener al menos 8 caracteres")
		.max(128, "La nueva contraseña debe tener menos de 128 caracteres")
		.regex(/[A-Z]/, "La nueva contraseña debe contener al menos una letra mayúscula")
		.regex(/[a-z]/, "La nueva contraseña debe contener al menos una letra minúscula")
		.regex(/[0-9]/, "La nueva contraseña debe contener al menos un número"),
});

// ============================================
// PASSWORD RESET RESPONSE SCHEMAS
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

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type VerifyEmailResponse = z.infer<typeof verifyEmailResponseSchema>;
export type ResendCodeRequest = z.infer<typeof resendCodeRequestSchema>;
export type ResendCodeResponse = z.infer<typeof resendCodeResponseSchema>;

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordResponse = z.infer<typeof forgotPasswordResponseSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
