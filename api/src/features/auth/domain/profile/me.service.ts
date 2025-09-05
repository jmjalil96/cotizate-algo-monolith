import type { PrismaClient } from "@prisma/client";
import type { Logger } from "../../../../config/logger.js";
import { AppError, notFound } from "../../../../shared/errors/AppError.js";
import { findSessionById } from "../../shared/repositories/session.repository.js";
import { findUserById } from "../../shared/repositories/user.repository.js";
import type { MeInput, MeResult } from "../../shared/types/registration.types.js";
import { flattenUserPermissions } from "../../shared/utils/permission.util.js";

/**
 * Me Service
 * Handles retrieval of current user profile data for authenticated users
 * Returns data in same format as login response for frontend state hydration
 */
export class MeService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Get current user profile data
	 * @param meData - User and session IDs with request context from authentication
	 * @param logger - Request-scoped logger for tracing
	 * @returns User profile data in same format as LoginResult but without action wrapper
	 */
	async getMe(meData: MeInput, logger?: Logger): Promise<MeResult> {
		const { userId, sessionId, ipAddress } = meData;

		try {
			// Fetch user and session data in parallel for performance
			const [user, session] = await Promise.all([
				findUserById(this.prisma, userId),
				findSessionById(this.prisma, sessionId),
			]);

			// Handle case where user is not found (rare but possible if deleted post-auth)
			if (!user) {
				logger?.error(
					{
						userId,
						sessionId,
						ipAddress,
					},
					"User not found during /me request - possible data integrity issue",
				);
				throw notFound("User");
			}

			// Handle case where session is not found (rare but possible if revoked post-auth)
			if (!session) {
				logger?.error(
					{
						userId,
						sessionId,
						ipAddress,
					},
					"Session not found during /me request - possible data integrity issue",
				);
				throw notFound("Session");
			}

			// Format response data to match MeResult interface exactly
			const result: MeResult = {
				user: {
					id: user.id,
					email: user.email,
					verified: user.verified,
					profile: {
						firstName: user.profile?.firstName || "",
						lastName: user.profile?.lastName || "",
					},
					organization: {
						id: user.organization.id,
						name: user.organization.name,
						slug: user.organization.slug,
					},
					permissions: flattenUserPermissions(user),
				},
				session: {
					id: session.id,
					expiresAt: session.expiresAt,
					lastActivity: session.lastActivity,
					tokenLastFour: session.tokenLastFour,
				},
			};

			// Log successful profile retrieval
			logger?.info(
				{
					userId,
					sessionId,
					organizationId: user.organizationId,
					permissions: result.user.permissions,
					ipAddress,
				},
				"Profile data retrieved successfully",
			);

			return result;
		} catch (error) {
			// Log internal errors (but not expected business errors)
			if (!(error instanceof AppError)) {
				logger?.error(
					{
						userId,
						sessionId,
						ipAddress,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during /me request",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}
}
