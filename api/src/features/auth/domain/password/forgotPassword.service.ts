import type { PrismaClient } from "@prisma/client";
import type { Logger } from "../../../../config/logger.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import {
	MAX_RESENDS,
	RESEND_COOLDOWN_SECONDS,
} from "../../shared/constants/registration.constants.js";
import {
	createOtpToken,
	createPasswordResetOtpSession,
	findActivePasswordResetSession,
	findPasswordResetSessionsWithActiveLocks,
	invalidateSessionTokens,
	updateSessionResendMetadata,
} from "../../shared/repositories/otp.repository.js";
import { findUserForLogin } from "../../shared/repositories/user.repository.js";
import type {
	ForgotPasswordInput,
	ForgotPasswordResult,
} from "../../shared/types/registration.types.js";
import { logOtpInDevelopment } from "../../shared/utils/email.util.js";
import { generateOTP } from "../../shared/utils/otp.util.js";

/**
 * Forgot Password Service
 * Handles password reset OTP generation with security-first design.
 * Unlike registration/resend, this service must prevent email enumeration attacks
 * while supporting both verified and unverified users.
 *
 * Core Responsibility: Secure password reset initiation with OTP delivery
 *
 * Key Security Differences from Registration/Resend:
 * - ALWAYS returns success (never reveals if email exists)
 * - Allows unverified users (they may have lost email access)
 * - No user/organization creation (read-only user lookup)
 * - Idempotent design (multiple calls = resend)
 */
export class ForgotPasswordService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main forgot password method - handles all password reset initiation paths
	 * @param forgotPasswordData - Email with request context for security/audit
	 * @returns Always success result (security design)
	 *
	 * FORGOT PASSWORD PATHS HANDLED:
	 * 1. Email doesn't exist → RETURN SUCCESS (security - no email enumeration)
	 * 2. Email exists but user unverified → PROCEED (allow password reset)
	 * 3. Email exists and user verified → PROCEED (standard case)
	 * 4. Active session exists but locked → RETURN SUCCESS (security - don't reveal lock state)
	 * 5. Active session exists, resend cooldown active → RETURN SUCCESS (security)
	 * 6. Active session exists, cooldown passed → TOKEN ROTATION (new OTP in same session)
	 * 7. No active session OR expired session → CREATE NEW SESSION (fresh start)
	 *
	 * SECURITY NOTES:
	 * - Always returns success with same message/format
	 * - Internal logging reveals actual flow for monitoring
	 * - Rate limiting still enforced but errors hidden from user
	 * - Prevents email enumeration while maintaining security controls
	 */
	async forgotPassword(
		forgotPasswordData: ForgotPasswordInput,
		logger?: Logger,
	): Promise<ForgotPasswordResult> {
		const { email, ipAddress, userAgent } = forgotPasswordData;

		try {
			// Check if user exists by email (but don't reveal result to client)
			const existingUser = await findUserForLogin(this.prisma, email);
			if (!existingUser) {
				logger?.info(
					{
						email: email,
						ipAddress,
					},
					"Password reset requested for non-existent email",
				);
				// Return success immediately for security (no session creation)
				return {
					success: true,
					message: "If this email exists, password reset instructions have been sent",
				};
			}

			// GLOBAL RATE LIMITING CHECK - prevents circumventing locks via new sessions
			const activeLock = await findPasswordResetSessionsWithActiveLocks(this.prisma, email);
			if (activeLock) {
				logger?.warn(
					{
						email: email,
						userId: existingUser.id,
						sessionId: activeLock.id,
						lockUntil: activeLock.lockUntil,
						ipAddress,
					},
					"Password reset blocked by active session lock",
				);
				// Return success to hide lock state from potential attackers
				return {
					success: true,
					message: "If this email exists, password reset instructions have been sent",
				};
			}

			// Check for existing active password reset session
			const existingSession = await findActivePasswordResetSession(this.prisma, email);

			if (existingSession) {
				// RESEND LOGIC - check cooldown and limits
				const now = new Date();
				const timeSinceLastSent = existingSession.lastSentAt
					? now.getTime() - existingSession.lastSentAt.getTime()
					: Number.MAX_SAFE_INTEGER;

				// Check resend cooldown (60 seconds)
				if (timeSinceLastSent < RESEND_COOLDOWN_SECONDS * 1000) {
					const waitSeconds = Math.ceil(
						(RESEND_COOLDOWN_SECONDS * 1000 - timeSinceLastSent) / 1000,
					);
					logger?.warn(
						{
							email: email,
							userId: existingUser.id,
							sessionId: existingSession.id,
							timeSinceLastSent,
							waitSeconds,
						},
						"Password reset rate limited",
					);
					// Return success to hide rate limiting from user
					return {
						success: true,
						message: "If this email exists, password reset instructions have been sent",
					};
				}

				// Check resend limits (5 max per session)
				if (existingSession.resendCount >= MAX_RESENDS) {
					logger?.warn(
						{
							email: email,
							userId: existingUser.id,
							sessionId: existingSession.id,
							resendCount: existingSession.resendCount,
						},
						"Too many password reset resends",
					);
					// Return success to hide limit from user
					return {
						success: true,
						message: "If this email exists, password reset instructions have been sent",
					};
				}

				// TOKEN ROTATION - valid resend in existing session
				const result = await this.prisma.$transaction(async (tx) => {
					// Invalidate old tokens
					await invalidateSessionTokens(tx, existingSession.id);

					// Generate new OTP
					const otpCode = generateOTP();
					const otpToken = await createOtpToken(tx, existingSession.id, otpCode);

					// Update resend metadata
					await updateSessionResendMetadata(
						tx,
						existingSession.id,
						existingSession.resendCount + 1,
						now,
					);

					// Log OTP in development
					logOtpInDevelopment(email, otpCode, otpToken.expiresAt, "password_reset");

					return {
						otpExpiresAt: otpToken.expiresAt,
						newSessionId: existingSession.id,
					};
				});

				logger?.info(
					{
						email: email,
						userId: existingUser.id,
						sessionId: existingSession.id,
						resendCount: existingSession.resendCount + 1,
					},
					"Password reset OTP token rotated",
				);

				return {
					success: true,
					message: "If this email exists, password reset instructions have been sent",
					otpExpiresAt: result.otpExpiresAt,
					newSessionId: result.newSessionId,
				};
			}

			// NEW SESSION CREATION - no existing active session
			const result = await this.prisma.$transaction(async (tx) => {
				// Create new password reset session
				const otpSession = await createPasswordResetOtpSession(tx, {
					userId: existingUser.id,
					organizationId: existingUser.organizationId,
					email: email,
					ipAddress,
					userAgent,
				});

				// Generate OTP and create token
				const otpCode = generateOTP();
				const otpToken = await createOtpToken(tx, otpSession.id, otpCode);

				// Log OTP in development
				logOtpInDevelopment(email, otpCode, otpToken.expiresAt, "password_reset");

				return {
					otpExpiresAt: otpToken.expiresAt,
					newSessionId: otpSession.id,
				};
			});

			logger?.info(
				{
					email: email,
					userId: existingUser.id,
					organizationId: existingUser.organizationId,
					sessionId: result.newSessionId,
				},
				"Password reset OTP session created",
			);

			return {
				success: true,
				message: "If this email exists, password reset instructions have been sent",
				otpExpiresAt: result.otpExpiresAt,
				newSessionId: result.newSessionId,
			};
		} catch (error) {
			// Log internal errors (but not expected business errors)
			if (!(error instanceof AppError)) {
				logger?.error(
					{
						email: email,
						ipAddress,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during password reset request",
				);
			}

			// SECURITY: Even on internal errors, return success to prevent information disclosure
			return {
				success: true,
				message: "If this email exists, password reset instructions have been sent",
			};
		}
	}
}
