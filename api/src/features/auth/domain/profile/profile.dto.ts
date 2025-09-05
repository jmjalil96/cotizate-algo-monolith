import { z } from "zod";

/**
 * Profile DTO - Response schemas for /me endpoint
 */

// ============================================
// RESPONSE SCHEMA
// ============================================

/**
 * GET /me response body (200 OK)
 * Reuses exact same user and session objects from login response for consistency
 */
export const meResponseSchema = z.object({
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

export type MeResponseDto = z.infer<typeof meResponseSchema>;
