import { z } from "zod";

/**
 * Session DTO - Request/Response schemas for /login endpoint
 */

// ============================================
// REQUEST SCHEMA
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

// ============================================
// RESPONSE SCHEMA
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

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
export type LoginResponseDto = z.infer<typeof loginResponseSchema>;
