import type { PrismaClient } from "@prisma/client";
import type { Logger } from "../../../../config/logger.js";
import { AppError, notFound } from "../../../../shared/errors/AppError.js";
import { revokeUserSessionsExcept } from "../../shared/repositories/session.repository.js";
import { findUserById, updateUserPasswordOnly } from "../../shared/repositories/user.repository.js";
import type {
	ChangePasswordInput,
	ChangePasswordResult,
} from "../../shared/types/registration.types.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.util.js";
import { invalidCurrentPassword } from "./password.errors.js";

/**
 * Change Password Service
 * Handles authenticated password changes for users who know their current password.
 * This is the standard password change flow for authenticated users (vs forgot/reset flow).
 *
 * Core Responsibility: Simple password update with security session management
 *
 * Key Security Design:
 * - User must provide current password (proof of identity)
 * - Keep current session active (user is actively authenticated)
 * - Revoke OTHER sessions for security (password changed = other devices should re-authenticate)
 * - Simple audit trail (user-initiated password change)
 *
 * Simplified Flow (Auth middleware handles most validation):
 * 1. Verify current password
 * 2. Hash new password
 * 3. Update user password
 * 4. Revoke other sessions (except current)
 * 5. Create audit log
 */
export class ChangePasswordService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main change password method - simple authenticated password update
	 * @param changePasswordData - Current/new passwords with user context from auth
	 * @param logger - Request-scoped logger for tracing
	 * @returns Change result with success status
	 *
	 * CHANGE PASSWORD FLOW:
	 * 1. Get user's current password hash (by userId from auth context)
	 * 2. Verify current password matches (user must prove they know current password)
	 * 3. Hash new password using hashPassword() utility
	 * 4. Update user password (simple password field update - no unlock/verify needed)
	 * 5. Revoke other sessions for security (keep current session active)
	 * 6. Create audit log for password change (UPDATE action)
	 *
	 * ERROR CASES:
	 * - Current password invalid → Throw error (potential security issue)
	 * - Database errors → Log and re-throw for controller handling
	 *
	 * SECURITY NOTES:
	 * - Much simpler than reset password (no OTP, no verification, no unlocking)
	 * - Auth middleware already validated user/session/organization status
	 * - Current session kept active (user authenticated with current password)
	 * - Other sessions revoked (security requirement when password changes)
	 */
	async changePassword(
		changePasswordData: ChangePasswordInput,
		logger?: Logger,
	): Promise<ChangePasswordResult> {
		const { userId, sessionId, currentPassword, newPassword, ipAddress, userAgent } =
			changePasswordData;

		try {
			// Get user's full data (need current password hash for verification)
			const user = await findUserById(this.prisma, userId);
			if (!user) {
				logger?.error(
					{
						userId,
						sessionId,
						ipAddress,
					},
					"User not found during password change - data integrity issue",
				);
				throw notFound("User");
			}

			// Verify current password (critical security check)
			const isValidCurrentPassword = await verifyPassword(currentPassword, user.password);
			if (!isValidCurrentPassword) {
				logger?.warn(
					{
						userId,
						sessionId,
						email: user.email,
						ipAddress,
					},
					"Invalid current password during password change",
				);
				throw invalidCurrentPassword();
			}

			// Hash new password
			const passwordHash = await hashPassword(newPassword);

			// TRANSACTION - Atomic password change operations
			const result = await this.prisma.$transaction(async (tx) => {
				// Update user password (simple password field update)
				await updateUserPasswordOnly(tx, userId, passwordHash);

				// Revoke other user sessions (keep current session active)
				const revokedCount = await revokeUserSessionsExcept(
					tx,
					userId,
					sessionId,
					"password_changed",
				);

				// Create audit log for password change
				await tx.auditLog.create({
					data: {
						userId: userId,
						organizationId: user.organizationId,
						action: "UPDATE",
						resource: "USER",
						resourceId: userId,
						ipAddress: ipAddress || null,
						userAgent: userAgent || null,
						before: {
							passwordChanged: false,
						},
						after: {
							passwordChanged: true,
						},
						metadata: {
							action: "PASSWORD_CHANGE",
							email: user.email,
							currentSessionKept: sessionId,
							otherSessionsRevoked: revokedCount,
						},
					},
				});

				return {
					success: true,
					message: "Password changed successfully",
					revokedCount,
				};
			});

			// Log successful password change
			logger?.info(
				{
					userId,
					sessionId,
					organizationId: user.organizationId,
					email: user.email,
					otherSessionsRevoked: result.revokedCount,
					ipAddress,
				},
				"Password changed successfully",
			);

			return {
				success: result.success,
				message: result.message,
			};
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
					"Internal error during password change",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}
}
