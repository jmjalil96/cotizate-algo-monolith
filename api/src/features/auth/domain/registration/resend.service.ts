import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../../config/logger.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import {
	MAX_RESENDS,
	RESEND_COOLDOWN_SECONDS,
} from "../../shared/constants/registration.constants.js";
import {
	createOtpAttempt,
	createOtpSession,
	createOtpToken,
	findAnyOtpSession,
	findSessionsWithActiveLocks,
	invalidateSessionTokens,
	markOtpSessionInactive,
	type OtpSessionWithUser,
	updateSessionResendMetadata,
} from "../../shared/repositories/otp.repository.js";
import { getUserByEmail } from "../../shared/repositories/user.repository.js";
import type { ResendInput, ResendResult } from "../../shared/types/registration.types.js";
import { logOtpInDevelopment } from "../../shared/utils/email.util.js";
import { generateOTP } from "../../shared/utils/otp.util.js";
import {
	noVerificationSession,
	resendRateLimited,
	tooManyResends,
	verificationSessionLocked,
} from "./registration.errors.js";

/**
 * Resend Service
 * Handles OTP code resending with session lifecycle management.
 * This service manages both token rotation within active sessions AND
 * new session creation for expired verification flows.
 *
 * Core Responsibility: Token rotation within active sessions OR new session creation for expired flows
 *
 * Key Design Principle: Sessions are immutable time-bounded containers
 * - Expired sessions are marked inactive and replaced with fresh sessions
 * - Active sessions get token rotation with resend tracking
 * - Rate limiting applies globally across all sessions for a user
 */

export class ResendService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main resend method - handles all 7 possible resend paths
	 * @param resendData - Email with request context for security/audit
	 * @returns Resend result with new OTP expiry or failure reason
	 *
	 * RESEND PATHS HANDLED:
	 * 1. No session exists → FAIL (direct to register)
	 * 2. Session expired (>24h) → CREATE NEW SESSION (mark old inactive + fresh session + token)
	 * 3. Session locked → FAIL (wait for unlock) - respects rate limiting globally
	 * 4. Too many resends (resendCount >= 5) → FAIL (prevent abuse)
	 * 5. Rate limiting (lastSentAt within 60s) → FAIL (wait X seconds)
	 * 6. User already verified → SUCCESS (idempotent no-op)
	 * 7. Valid resend → TOKEN ROTATION (invalidate old tokens + create new in same session)
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex 7-path verification logic required for security
	async resendCode(resendData: ResendInput): Promise<ResendResult> {
		const { email, ipAddress, userAgent, requestId } = resendData;

		// Log resend attempt
		logger.info(
			{
				email,
				ipAddress,
				requestId,
			},
			"OTP resend attempt",
		);

		try {
			// GLOBAL RATE LIMITING CHECK - prevents circumventing locks via new sessions
			const activeLock = await findSessionsWithActiveLocks(this.prisma, email);
			if (activeLock) {
				logger.warn(
					{
						email: email,
						sessionId: activeLock.id,
						lockUntil: activeLock.lockUntil,
						requestId,
					},
					"Resend blocked by active session lock",
				);
				if (!activeLock.lockUntil) {
					throw new Error("Active lock missing lockUntil - invalid state");
				}
				throw verificationSessionLocked(activeLock.lockUntil);
			}

			// PATH 6 EARLY EXIT - Check if user already verified (optimization)
			const existingUser = await getUserByEmail(this.prisma, email);
			if (existingUser?.verified) {
				logger.info(
					{
						userId: existingUser.id,
						email: email,
						requestId,
					},
					"User already verified - resend no-op",
				);

				return {
					success: true,
					message: "Email already verified",
				};
			}

			// PATH 1 - Find any session for email (active or inactive)
			const session = await findAnyOtpSession(this.prisma, email);
			if (!session) {
				logger.warn(
					{
						email: email,
						ipAddress,
						requestId,
					},
					"No verification session found for resend",
				);
				throw noVerificationSession();
			}

			const now = new Date();

			// PATH 2 - Handle expired session (>24h) - Create replacement session
			if (session.expiresAt < now) {
				logger.info(
					{
						email: email,
						sessionId: session.id,
						expiresAt: session.expiresAt,
						requestId,
					},
					"Creating replacement session for expired session",
				);

				const result = await this.createReplacementSession(session, email, {
					ipAddress,
					userAgent,
					requestId,
				});

				return result;
			}

			// From here, session is active (not expired)

			// PATH 3 - Check active session lock status
			if (session.lockUntil && session.lockUntil > now) {
				logger.warn(
					{
						email: email,
						sessionId: session.id,
						lockUntil: session.lockUntil,
						requestId,
					},
					"Active session is locked",
				);
				throw verificationSessionLocked(session.lockUntil);
			}

			// PATH 4 - Check resend count limits (abuse prevention)
			if (session.resendCount >= MAX_RESENDS) {
				logger.warn(
					{
						email: email,
						sessionId: session.id,
						resendCount: session.resendCount,
						maxResends: MAX_RESENDS,
						requestId,
					},
					"Too many resend attempts for session",
				);
				throw tooManyResends();
			}

			// PATH 5 - Rate limiting check (anti-spam)
			if (session.lastSentAt) {
				const timeSinceLastSend = now.getTime() - session.lastSentAt.getTime();
				const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;

				if (timeSinceLastSend < cooldownMs) {
					const waitSeconds = Math.ceil((cooldownMs - timeSinceLastSend) / 1000);

					logger.warn(
						{
							email: email,
							sessionId: session.id,
							timeSinceLastSend: timeSinceLastSend,
							waitSeconds,
							requestId,
						},
						"Resend rate limited",
					);

					throw resendRateLimited(waitSeconds);
				}
			}

			// PATH 7 - Valid resend (token rotation in same session)
			const result = await this.rotateTokenInSession(session, {
				email: email,
				ipAddress,
				userAgent,
				requestId,
			});

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
					"Internal error during OTP resend",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}

	/**
	 * Create a fresh session to replace an expired one
	 * Used when user requests resend after session expiry (24h)
	 * @param oldSession - The expired session to replace
	 * @param email - User email
	 * @param requestContext - Request metadata for audit
	 * @returns New session with fresh token
	 */
	private async createReplacementSession(
		oldSession: OtpSessionWithUser,
		email: string,
		requestContext: { ipAddress: string; userAgent: string; requestId: string },
	): Promise<ResendResult> {
		const { ipAddress, userAgent, requestId } = requestContext;

		// Execute session replacement in transaction
		const result = await this.prisma.$transaction(async (tx) => {
			// Mark old session as inactive
			await markOtpSessionInactive(tx, oldSession.id);

			// Create new session with fresh 24h expiry
			if (!oldSession.userId || !oldSession.organizationId) {
				throw new Error("Old session missing userId or organizationId - invalid state");
			}

			const newSession = await createOtpSession(tx, {
				userId: oldSession.userId,
				organizationId: oldSession.organizationId,
				email: email,
				ipAddress,
				userAgent,
			});

			// Generate and create new OTP token
			const otpCode = generateOTP();
			const newToken = await createOtpToken(tx, newSession.id, otpCode);

			// Create audit log for session replacement
			await tx.auditLog.create({
				data: {
					userId: oldSession.userId,
					organizationId: oldSession.organizationId,
					action: "CREATE",
					resource: "OTP_SESSION",
					resourceId: newSession.id,
					ipAddress: ipAddress || null,
					userAgent: userAgent || null,
					before: { sessionId: oldSession.id, expired: true },
					after: { sessionId: newSession.id, fresh: true },
					metadata: {
						action: "SESSION_REPLACEMENT",
						email: email,
						oldSessionId: oldSession.id,
						newSessionId: newSession.id,
						reason: "SESSION_EXPIRED",
						requestId,
					},
				},
			});

			// Log OTP in development
			logOtpInDevelopment(email, otpCode, newToken.expiresAt, "resend");

			return {
				success: true,
				message: "New verification code sent",
				otpExpiresAt: newToken.expiresAt,
				newSessionId: newSession.id, // Return session ID for logging
			};
		});

		// Log successful session replacement
		logger.info(
			{
				email: email,
				oldSessionId: oldSession.id,
				newSessionId: result.newSessionId, // Use actual session ID
				requestId,
			},
			"OTP session replacement completed",
		);

		return result;
	}

	/**
	 * Rotate token within existing active session
	 * Used when session is valid but user needs new code
	 * @param session - Active session to rotate token for
	 * @param requestContext - Request metadata for audit
	 * @returns Updated session with new token
	 */
	private async rotateTokenInSession(
		session: OtpSessionWithUser,
		requestContext: { email: string; ipAddress: string; userAgent: string; requestId: string },
	): Promise<ResendResult> {
		const { email, ipAddress, userAgent, requestId } = requestContext;

		// Execute token rotation in transaction
		const result = await this.prisma.$transaction(async (tx) => {
			// Invalidate all existing tokens in session
			await invalidateSessionTokens(tx, session.id);

			// Create new token in same session
			const otpCode = generateOTP();
			const newToken = await createOtpToken(tx, session.id, otpCode);

			// Update session resend metadata
			const newResendCount = session.resendCount + 1;
			const now = new Date();
			await updateSessionResendMetadata(tx, session.id, newResendCount, now);

			// Create audit record for token rotation
			await createOtpAttempt(tx, {
				sessionId: session.id,
				tokenId: newToken.id,
				...(session.userId && { userId: session.userId }),
				email: email,
				status: "SUCCESS",
				reason: "TOKEN_ROTATION",
				ipAddress,
				userAgent,
			});

			// Log OTP in development
			logOtpInDevelopment(email, otpCode, newToken.expiresAt, "resend");

			return {
				success: true,
				message: "New verification code sent",
				otpExpiresAt: newToken.expiresAt,
			};
		});

		// Log successful token rotation
		logger.info(
			{
				email: email,
				sessionId: session.id,
				resendCount: session.resendCount + 1,
				requestId,
			},
			"OTP token rotation completed",
		);

		return result;
	}
}
