import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../../config/logger.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import {
	createOtpAttempt,
	findActiveOtpSession,
	findUnconsumedOtpTokens,
	incrementOtpSessionAttempts,
	markOtpSessionInactive,
	markOtpTokenConsumed,
} from "../../shared/repositories/otp.repository.js";
import { getUserByEmail, markUserVerified } from "../../shared/repositories/user.repository.js";
import type { VerifyEmailInput, VerifyEmailResult } from "../../shared/types/registration.types.js";
import { verifyOTP } from "../../shared/utils/otp.util.js";
import {
	invalidVerificationCode,
	noActiveVerificationSession,
	noValidVerificationCode,
	verificationCodeExpired,
	verificationSessionExpired,
	verificationSessionLocked,
} from "./registration.errors.js";

/**
 * Email Verification Service
 * Handles the complete email verification flow including OTP validation
 * and user account activation. This is a READ-ONLY service for OTP tables -
 * it never creates new sessions or tokens, only validates existing ones.
 *
 * Responsibility: Pure verification logic with clear separation of concerns
 * - Register endpoint creates OTP sessions/tokens
 * - Resend endpoint handles token rotation
 * - Verify endpoint (this service) validates and completes verification
 */

export class EmailVerificationService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main verification method - handles all 7 possible verification paths
	 * @param verificationData - Email and OTP code with request context
	 * @returns Verification result with success/failure status and next steps
	 *
	 * VERIFICATION PATHS HANDLED:
	 * 1. No active session found → FAIL (redirect to register/resend)
	 * 2. Session expired (>24h) → FAIL (redirect to resend)
	 * 3. Session locked (too many attempts) → FAIL (wait for cooldown)
	 * 4. No unconsumed tokens available → FAIL (redirect to resend)
	 * 5. Token expired (>15min) → FAIL (request new code)
	 * 6. Wrong OTP code → FAIL + increment attempts + audit log
	 * 7. Correct OTP code → SUCCESS + mark consumed + verify user + audit log
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex 7-path verification logic required for security
	async verifyEmail(verificationData: VerifyEmailInput): Promise<VerifyEmailResult> {
		const { email, otpCode, ipAddress, userAgent, requestId } = verificationData;

		// Log verification attempt
		logger.info(
			{
				email,
				ipAddress,
				requestId,
			},
			"Email verification attempt",
		);

		try {
			// EARLY EXIT OPTIMIZATION: Check if user already verified
			const existingUser = await getUserByEmail(this.prisma, email);
			if (existingUser?.verified) {
				logger.info(
					{
						userId: existingUser.id,
						email: email,
						requestId,
					},
					"User already verified - returning success",
				);

				return {
					success: true,
					message: "Email already verified",
				};
			}

			// PATH 1: Find active verification session
			const session = await findActiveOtpSession(this.prisma, email);
			if (!session) {
				logger.warn(
					{
						email: email,
						ipAddress,
						requestId,
					},
					"No active verification session found",
				);
				throw noActiveVerificationSession();
			}

			const now = new Date();

			// PATH 2: Validate session expiry (24 hour window)
			if (session.expiresAt < now) {
				logger.warn(
					{
						email: email,
						sessionId: session.id,
						expiresAt: session.expiresAt,
						requestId,
					},
					"Verification session expired",
				);
				throw verificationSessionExpired();
			}

			// PATH 3: Check session lock status (rate limiting)
			if (session.lockUntil && session.lockUntil > now) {
				logger.warn(
					{
						email: email,
						sessionId: session.id,
						lockUntil: session.lockUntil,
						requestId,
					},
					"Verification session locked",
				);
				throw verificationSessionLocked(session.lockUntil);
			}

			// PATH 4: Find valid unconsumed token
			const tokens = await findUnconsumedOtpTokens(this.prisma, session.id);
			if (tokens.length === 0) {
				logger.warn(
					{
						email: email,
						sessionId: session.id,
						requestId,
					},
					"No valid verification codes available",
				);
				throw noValidVerificationCode();
			}

			// Get the most recent token
			const token = tokens[0];
			if (!token) {
				// This shouldn't happen since we checked tokens.length above, but for type safety
				throw noValidVerificationCode();
			}

			// PATH 5: Validate token expiry (15 minute window)
			if (token.expiresAt < now) {
				logger.warn(
					{
						email: email,
						sessionId: session.id,
						tokenId: token.id,
						expiresAt: token.expiresAt,
						requestId,
					},
					"Verification code expired",
				);
				throw verificationCodeExpired();
			}

			// PATH 6: Verify OTP code against hash
			if (!token.codeHash) {
				// Token missing hash - invalid state, treat as expired
				throw verificationCodeExpired();
			}

			const isValidCode = verifyOTP(otpCode, token.codeHash);
			if (!isValidCode) {
				// Increment attempts and check for lock
				const updatedSession = await incrementOtpSessionAttempts(this.prisma, session.id);

				// Create failure audit record
				await createOtpAttempt(this.prisma, {
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

				logger.warn(
					{
						email: email,
						sessionId: session.id,
						tokenId: token.id,
						attemptCount: updatedSession.attemptCount,
						attemptsRemaining,
						locked: !!updatedSession.lockUntil,
						requestId,
					},
					"Invalid verification code provided",
				);

				throw invalidVerificationCode(attemptsRemaining);
			}

			// PATH 7: SUCCESS FLOW - Transaction required
			const result = await this.prisma.$transaction(async (tx) => {
				// Mark token as consumed
				await markOtpTokenConsumed(tx, token.id);

				// Mark session as inactive
				await markOtpSessionInactive(tx, session.id);

				// Update user verification status
				if (!session.userId) {
					throw new Error("Session missing userId - invalid state");
				}
				const verifiedUser = await markUserVerified(tx, session.userId);

				// Create successful audit record
				await createOtpAttempt(tx, {
					sessionId: session.id,
					tokenId: token.id,
					...(session.userId && { userId: session.userId }),
					email: email,
					status: "SUCCESS",
					ipAddress,
					userAgent,
				});

				// Create audit log for user verification (UPDATE action)
				await tx.auditLog.create({
					data: {
						userId: verifiedUser.id,
						organizationId: verifiedUser.organizationId,
						action: "UPDATE",
						resource: "USER",
						resourceId: verifiedUser.id,
						ipAddress: ipAddress || null,
						userAgent: userAgent || null,
						before: { verified: false },
						after: { verified: true, verifiedAt: new Date() },
						metadata: {
							action: "EMAIL_VERIFICATION",
							email: email,
							sessionId: session.id,
							tokenId: token.id,
							requestId,
						},
					},
				});

				return {
					success: true,
					message: "Email verified successfully",
				};
			});

			// Log successful verification
			logger.info(
				{
					userId: session.userId,
					organizationId: session.organizationId,
					email: email,
					sessionId: session.id,
					tokenId: token.id,
					requestId,
				},
				"Email verification completed successfully",
			);

			return result;
		} catch (error) {
			// Log internal errors (but not expected business errors)
			if (!(error instanceof AppError)) {
				logger.error(
					{
						email: email,
						ipAddress,
						requestId,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during email verification",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}
}
