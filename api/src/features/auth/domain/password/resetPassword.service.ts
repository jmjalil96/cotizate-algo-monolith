import type { PrismaClient } from "@prisma/client";
import type { Logger } from "../../../../config/logger.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import {
	createPasswordResetOtpAttempt,
	findActivePasswordResetSession,
	findUnconsumedOtpTokens,
	incrementOtpSessionAttempts,
	markOtpSessionInactive,
	markOtpTokenConsumed,
} from "../../shared/repositories/otp.repository.js";
import { revokeUserSessions } from "../../shared/repositories/session.repository.js";
import { findUserForLogin, updateUserPassword } from "../../shared/repositories/user.repository.js";
import type {
	ResetPasswordInput,
	ResetPasswordResult,
} from "../../shared/types/registration.types.js";
import { verifyOTP } from "../../shared/utils/otp.util.js";
import { hashPassword } from "../../shared/utils/password.util.js";
import {
	invalidPasswordResetCode,
	noActivePasswordResetSession,
	noValidPasswordResetCode,
	passwordResetCodeExpired,
	passwordResetSessionExpired,
	passwordResetSessionLocked,
} from "./password.errors.js";

/**
 * Reset Password Service
 * Handles password reset completion with OTP validation, password update, account recovery,
 * and comprehensive security actions. This service combines multiple security operations
 * in a single atomic transaction for complete account recovery.
 *
 * Core Responsibility: Complete password reset flow with multi-faceted security recovery
 *
 * Key Security Actions on Success:
 * - Password update with new hash
 * - Account unlock (if locked from failed login attempts)
 * - User verification (if not verified - secondary verification option)
 * - Global session revocation (password changed = all devices logged out)
 * - Comprehensive audit logging for security monitoring
 */
export class ResetPasswordService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main reset password method - handles all password reset completion paths
	 * @param resetPasswordData - Email, OTP code, new password with request context
	 * @param logger - Request-scoped logger for tracing
	 * @returns Reset result with success/failure status
	 *
	 * RESET PASSWORD PATHS HANDLED (Same as EmailVerification but PURPOSE_RESET):
	 * 1. No active password reset session found → FAIL (redirect to forgot-password)
	 * 2. Session expired (>24h) → FAIL (redirect to forgot-password)
	 * 3. Session locked (too many attempts) → FAIL (wait for cooldown)
	 * 4. No unconsumed tokens available → FAIL (redirect to forgot-password)
	 * 5. Token expired (>15min) → FAIL (request new code)
	 * 6. Wrong OTP code → FAIL + increment attempts + audit log
	 * 7. Correct OTP code → SUCCESS TRANSACTION (password + verification + security actions)
	 *
	 * SUCCESS TRANSACTION OPERATIONS:
	 * - Mark OTP token as consumed (prevent reuse)
	 * - Mark OTP session as inactive (complete the flow)
	 * - Hash new password using hashPassword() utility
	 * - Update user password + unlock account + verify user (if not verified)
	 * - Revoke ALL user sessions across all devices (security requirement)
	 * - Create comprehensive audit log (PASSWORD_CHANGED action)
	 * - Create successful OTP attempt record for audit trail
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex 7-path password reset validation logic required for security
	async resetPassword(
		resetPasswordData: ResetPasswordInput,
		logger?: Logger,
	): Promise<ResetPasswordResult> {
		const { email, otpCode, newPassword, ipAddress, userAgent } = resetPasswordData;

		try {
			// EARLY EXIT OPTIMIZATION: Get user data for verification status tracking
			const existingUser = await findUserForLogin(this.prisma, email);
			if (!existingUser) {
				logger?.warn(
					{
						email: email,
						ipAddress,
					},
					"Password reset failed - user not found",
				);
				throw noActivePasswordResetSession();
			}

			const wasUnverified = !existingUser.verified;

			// PATH 1: Find active password reset session
			const session = await findActivePasswordResetSession(this.prisma, email);
			if (!session) {
				logger?.warn(
					{
						email: email,
						userId: existingUser.id,
						ipAddress,
					},
					"No active password reset session found",
				);
				throw noActivePasswordResetSession();
			}

			const now = new Date();

			// PATH 2: Validate session expiry (24 hour window)
			if (session.expiresAt < now) {
				logger?.warn(
					{
						email: email,
						userId: existingUser.id,
						sessionId: session.id,
						expiresAt: session.expiresAt,
					},
					"Password reset session expired",
				);
				throw passwordResetSessionExpired();
			}

			// PATH 3: Check session lock status (rate limiting)
			if (session.lockUntil && session.lockUntil > now) {
				logger?.warn(
					{
						email: email,
						userId: existingUser.id,
						sessionId: session.id,
						lockUntil: session.lockUntil,
					},
					"Password reset session locked",
				);
				throw passwordResetSessionLocked(session.lockUntil);
			}

			// PATH 4: Find valid unconsumed token
			const tokens = await findUnconsumedOtpTokens(this.prisma, session.id);
			if (tokens.length === 0) {
				logger?.warn(
					{
						email: email,
						userId: existingUser.id,
						sessionId: session.id,
					},
					"No valid password reset codes available",
				);
				throw noValidPasswordResetCode();
			}

			// Get the most recent token
			const token = tokens[0];
			if (!token) {
				throw noValidPasswordResetCode();
			}

			// PATH 5: Validate token expiry (15 minute window)
			if (token.expiresAt < now) {
				logger?.warn(
					{
						email: email,
						userId: existingUser.id,
						sessionId: session.id,
						tokenId: token.id,
						expiresAt: token.expiresAt,
					},
					"Password reset code expired",
				);
				throw passwordResetCodeExpired();
			}

			// PATH 6: Verify OTP code against hash
			if (!token.codeHash) {
				throw passwordResetCodeExpired();
			}

			const isValidCode = verifyOTP(otpCode, token.codeHash);
			if (!isValidCode) {
				// Increment attempts and check for lock
				const updatedSession = await incrementOtpSessionAttempts(this.prisma, session.id);

				// Create failure audit record
				await createPasswordResetOtpAttempt(this.prisma, {
					sessionId: session.id,
					tokenId: token.id,
					...(session.userId && { userId: session.userId }),
					email: email,
					status: "FAILURE",
					reason: "INVALID_CODE",
					ipAddress,
					userAgent,
				});

				const attemptsRemaining = Math.max(
					0,
					updatedSession.maxAttempts - updatedSession.attemptCount,
				);

				logger?.warn(
					{
						email: email,
						userId: existingUser.id,
						sessionId: session.id,
						tokenId: token.id,
						attemptCount: updatedSession.attemptCount,
						attemptsRemaining,
						locked: !!updatedSession.lockUntil,
					},
					"Invalid password reset code provided",
				);

				throw invalidPasswordResetCode(attemptsRemaining);
			}

			// PATH 7: SUCCESS FLOW - Complex transaction with password reset operations
			const result = await this.prisma.$transaction(async (tx) => {
				// Mark token as consumed
				await markOtpTokenConsumed(tx, token.id);

				// Mark session as inactive
				await markOtpSessionInactive(tx, session.id);

				// Hash new password
				const passwordHash = await hashPassword(newPassword);

				// Update user password + unlock + verify (atomic operation)
				await updateUserPassword(tx, existingUser.id, passwordHash, wasUnverified);

				// Revoke all user sessions for security (password changed)
				const revokedCount = await revokeUserSessions(tx, existingUser.id, "password_changed");

				// Create successful audit record
				await createPasswordResetOtpAttempt(tx, {
					sessionId: session.id,
					tokenId: token.id,
					userId: existingUser.id,
					email: email,
					status: "SUCCESS",
					ipAddress,
					userAgent,
				});

				// Create audit log for password reset
				await tx.auditLog.create({
					data: {
						userId: existingUser.id,
						organizationId: existingUser.organizationId,
						action: "UPDATE",
						resource: "USER",
						resourceId: existingUser.id,
						ipAddress: ipAddress || null,
						userAgent: userAgent || null,
						before: {
							verified: existingUser.verified,
							isLocked: existingUser.isLocked,
							loginAttempts: existingUser.loginAttempts,
						},
						after: {
							verified: true,
							isLocked: false,
							loginAttempts: 0,
							...(wasUnverified && { verifiedAt: new Date() }),
						},
						metadata: {
							action: "PASSWORD_RESET",
							email: email,
							sessionId: session.id,
							tokenId: token.id,
							sessionsRevoked: revokedCount,
							secondaryVerification: wasUnverified,
						},
					},
				});

				return {
					success: true,
					message: "Password reset successfully",
				};
			});

			// Log successful password reset
			logger?.info(
				{
					userId: existingUser.id,
					organizationId: existingUser.organizationId,
					email: email,
					sessionId: session.id,
					tokenId: token.id,
					wasUnverified,
					secondaryVerification: wasUnverified,
				},
				"Password reset completed successfully",
			);

			return result;
		} catch (error) {
			// Log internal errors (but not expected business errors)
			if (!(error instanceof AppError)) {
				logger?.error(
					{
						email: email,
						ipAddress,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during password reset",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}
}
