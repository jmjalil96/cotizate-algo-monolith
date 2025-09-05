import type { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import type { Logger } from "../../../../config/logger.js";
import {
	findSessionByTokenHash,
	revokeSession,
	revokeUserSessions,
} from "../../shared/repositories/session.repository.js";
import type { LogoutInput, LogoutResult } from "../../shared/types/registration.types.js";
import { clearAuthCookie, getAuthTokenFromCookie } from "../../shared/utils/cookie.util.js";
import { hashSessionToken } from "../../shared/utils/session.util.js";

/**
 * Logout Service
 * Handles user session termination with optional bulk revocation.
 * Simple service focused on session cleanup and security logging.
 *
 * Core Responsibility: Terminate user sessions securely
 *
 * Key Features:
 * - Single session logout (current device)
 * - Bulk logout with "everywhere" option (all user devices)
 * - Idempotent design (safe to call multiple times)
 * - Comprehensive audit logging for security monitoring
 * - Secure cookie clearing
 */

export class LogoutService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main logout method - terminates user session(s)
	 * @param logoutData - Everywhere flag with request context
	 * @param req - Express request object (to extract cookie)
	 * @param res - Express response object (to clear cookie)
	 * @returns Logout result with session info
	 *
	 * LOGOUT FLOW STEPS:
	 * 1. Extract session token from cookie → Return success if no token (idempotent)
	 * 2. Hash token and find session in database
	 * 3. Handle session states (not found, already revoked) → Idempotent success
	 * 4. Check everywhere flag for bulk vs single logout
	 * 5. Revoke session(s) with appropriate reason
	 * 6. Clear authentication cookie
	 * 7. Create audit log(s) for logout action(s)
	 * 8. Return success with revocation count
	 */
	async logout(
		logoutData: LogoutInput,
		req: Request,
		res: Response,
		logger?: Logger,
	): Promise<LogoutResult> {
		const { everywhere = false, ipAddress, userAgent } = logoutData;

		try {
			// STEP 1 - Extract session token from cookie
			const token = getAuthTokenFromCookie(req);
			if (!token) {
				// No token found - user already logged out (idempotent)
				clearAuthCookie(res);

				logger?.info(
					{
						ipAddress,
						userAgent,
					},
					"Logout completed - no active session",
				);

				return {
					success: true,
					message: "Logged out successfully",
					sessionsRevoked: 0,
				};
			}

			// STEP 2 - Hash token and find session
			const tokenHash = hashSessionToken(token);
			const session = await findSessionByTokenHash(this.prisma, tokenHash);

			if (!session) {
				// Session not found - invalid token (idempotent)
				clearAuthCookie(res);

				logger?.info(
					{
						tokenLastFour: token.slice(-4),
						ipAddress,
						userAgent,
					},
					"Logout completed - session not found",
				);

				return {
					success: true,
					message: "Logged out successfully",
					sessionsRevoked: 0,
				};
			}

			// STEP 3 - Check session validity (idempotent for invalid sessions)
			const now = new Date();
			const isAlreadyRevoked = session.revokedAt !== null;
			const isExpired = session.expiresAt < now;

			if (isAlreadyRevoked || isExpired) {
				// Session already invalid - clear cookie and succeed (idempotent)
				clearAuthCookie(res);

				logger?.info(
					{
						sessionId: session.id,
						userId: session.userId,
						tokenLastFour: token.slice(-4),
						isRevoked: isAlreadyRevoked,
						isExpired,
						ipAddress,
						userAgent,
					},
					"Logout completed - session already invalid",
				);

				return {
					success: true,
					message: "Logged out successfully",
					sessionsRevoked: 0,
				};
			}

			// STEP 4-5 - Execute logout in transaction
			const result = await this.prisma.$transaction(async (tx) => {
				let sessionsRevoked = 0;
				const reason = everywhere ? "logout_everywhere" : "logout";

				if (everywhere) {
					// Revoke all active sessions for user
					sessionsRevoked = await revokeUserSessions(tx, session.userId, reason);
				} else {
					// Revoke only current session
					await revokeSession(tx, session.id, reason);
					sessionsRevoked = 1;
				}

				// STEP 7 - Create audit log for logout
				await tx.auditLog.create({
					data: {
						userId: session.userId,
						organizationId: session.organizationId,
						action: "LOGOUT",
						resource: "SESSION",
						resourceId: everywhere ? null : session.id,
						ipAddress: ipAddress || null,
						userAgent: userAgent || null,
						metadata: {
							sessionsRevoked,
							scope: everywhere ? "everywhere" : "single",
							reason,
							deviceInfo: { ipAddress, userAgent },
						},
					},
				});

				return {
					success: true,
					message: everywhere
						? `Logged out from ${sessionsRevoked} devices`
						: "Logged out successfully",
					sessionsRevoked,
				};
			});

			// STEP 6 - Clear authentication cookie (always)
			clearAuthCookie(res);

			// Log successful logout
			logger?.info(
				{
					sessionId: session.id,
					userId: session.userId,
					organizationId: session.organizationId,
					sessionsRevoked: result.sessionsRevoked,
					scope: everywhere ? "everywhere" : "single",
					ipAddress,
					userAgent,
				},
				"Logout completed successfully",
			);

			return result;
		} catch (error) {
			// Internal error occurred - log but still complete logout for security
			logger?.error(
				{
					ipAddress,
					userAgent,
					error: error instanceof Error ? error.message : String(error),
				},
				"Internal error during logout - proceeding with logout anyway",
			);

			// STEP 6 - Always clear cookie even on error (security-first)
			clearAuthCookie(res);

			// STEP 8 - Always return success (idempotent design)
			return {
				success: true,
				message: "Logged out successfully",
				sessionsRevoked: 0,
			};
		}
	}
}
