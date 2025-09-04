import type {
	Organization,
	OtpAttempt,
	OtpSession,
	OtpToken,
	Prisma,
	PrismaClient,
	User,
} from "@prisma/client";
import {
	OTP_EXPIRY_MINUTES,
	OTP_LENGTH,
	OTP_LOCK_DURATION_MINUTES,
	SESSION_EXPIRY_HOURS,
} from "../constants/registration.constants.js";
import { hashOTP } from "../utils/otp.util.js";

/**
 * OTP repository helper functions
 * Data access layer for OTP-related operations
 */

/**
 * Create an OTP session for email verification
 * @param prisma - Prisma client instance (or transaction)
 * @param data - Session creation data
 * @returns Created OTP session
 */
export async function createOtpSession(
	prisma: Prisma.TransactionClient,
	data: {
		userId: string;
		organizationId: string;
		email: string;
		ipAddress?: string;
		userAgent?: string;
	},
): Promise<OtpSession> {
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

	return prisma.otpSession.create({
		data: {
			userId: data.userId,
			organizationId: data.organizationId,
			email: data.email,
			purpose: "EMAIL_VERIFICATION",
			channel: "EMAIL",
			expiresAt: expiresAt,
			lastSentAt: now,
			ipAddress: data.ipAddress || null,
			userAgent: data.userAgent || null,
		},
	});
}

/**
 * Create an OTP token record
 * @param prisma - Prisma client instance (or transaction)
 * @param sessionId - OTP session ID
 * @param otpCode - Plain OTP code (will be hashed)
 * @returns Created OTP token
 */
export async function createOtpToken(
	prisma: Prisma.TransactionClient,
	sessionId: string,
	otpCode: string,
): Promise<OtpToken> {
	const now = new Date();
	const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
	const codeHash = hashOTP(otpCode);

	return prisma.otpToken.create({
		data: {
			sessionId: sessionId,
			codeHash: codeHash,
			codeLength: OTP_LENGTH,
			expiresAt: expiresAt,
		},
	});
}

// ============================================
// EMAIL VERIFICATION FUNCTIONS
// ============================================

/**
 * Type definition for OTP session with user and organization relations
 */
export type OtpSessionWithUser = OtpSession & {
	user: User | null;
	organization: Organization | null;
};

/**
 * Find active OTP session for email verification by email
 * Returns the most recent active session to handle edge cases of multiple sessions
 * @param prisma - Prisma client instance
 * @param email - Normalized email address
 * @returns Most recent active session or null if not found
 */
export async function findActiveOtpSession(
	prisma: PrismaClient | Prisma.TransactionClient,
	email: string,
): Promise<OtpSessionWithUser | null> {
	const normalizedEmail = email.toLowerCase().trim();

	return prisma.otpSession.findFirst({
		where: {
			email: normalizedEmail,
			purpose: "EMAIL_VERIFICATION",
			active: true,
		},
		include: {
			user: true,
			organization: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

/**
 * Find unconsumed OTP tokens for a session
 * Returns tokens that haven't been consumed, ordered by most recent first
 * @param prisma - Prisma client instance
 * @param sessionId - OTP session ID
 * @returns Array of valid unconsumed tokens
 */
export async function findUnconsumedOtpTokens(
	prisma: PrismaClient | Prisma.TransactionClient,
	sessionId: string,
): Promise<OtpToken[]> {
	return prisma.otpToken.findMany({
		where: {
			sessionId: sessionId,
			consumedAt: null,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

/**
 * Increment session attempt count and apply lock if max attempts reached
 * @param prisma - Prisma transaction client
 * @param sessionId - OTP session ID
 * @returns Updated OTP session with potentially applied lock
 */
export async function incrementOtpSessionAttempts(
	prisma: Prisma.TransactionClient,
	sessionId: string,
): Promise<OtpSession> {
	const now = new Date();

	// Get current session to check attempt count
	const currentSession = await prisma.otpSession.findUnique({
		where: { id: sessionId },
		select: { attemptCount: true, maxAttempts: true },
	});

	if (!currentSession) {
		throw new Error(`OTP session not found: ${sessionId}`);
	}

	const newAttemptCount = currentSession.attemptCount + 1;
	const shouldLock = newAttemptCount >= currentSession.maxAttempts;

	// Calculate lock expiry if needed
	const lockUntil = shouldLock
		? new Date(now.getTime() + OTP_LOCK_DURATION_MINUTES * 60 * 1000)
		: null;

	return prisma.otpSession.update({
		where: { id: sessionId },
		data: {
			attemptCount: newAttemptCount,
			lastAttemptAt: now,
			lockUntil: lockUntil,
		},
	});
}

/**
 * Mark OTP token as consumed
 * @param prisma - Prisma transaction client
 * @param tokenId - OTP token ID
 * @returns Updated OTP token
 */
export async function markOtpTokenConsumed(
	prisma: Prisma.TransactionClient,
	tokenId: string,
): Promise<OtpToken> {
	const now = new Date();

	return prisma.otpToken.update({
		where: { id: tokenId },
		data: { consumedAt: now },
	});
}

/**
 * Mark OTP session as inactive
 * @param prisma - Prisma transaction client
 * @param sessionId - OTP session ID
 * @returns Updated OTP session
 */
export async function markOtpSessionInactive(
	prisma: Prisma.TransactionClient,
	sessionId: string,
): Promise<OtpSession> {
	return prisma.otpSession.update({
		where: { id: sessionId },
		data: { active: false },
	});
}

/**
 * Create OTP verification attempt record for audit trail
 * @param prisma - Prisma transaction client
 * @param data - OTP attempt data
 * @returns Created OTP attempt record
 */
export async function createOtpAttempt(
	prisma: Prisma.TransactionClient,
	data: {
		sessionId: string;
		tokenId?: string;
		userId?: string;
		email: string;
		status: "SUCCESS" | "FAILURE" | "EXPIRED" | "LOCKED";
		reason?: string;
		ipAddress?: string;
		userAgent?: string;
	},
): Promise<OtpAttempt> {
	return prisma.otpAttempt.create({
		data: {
			sessionId: data.sessionId,
			tokenId: data.tokenId || null,
			userId: data.userId || null,
			email: data.email.toLowerCase().trim(),
			purpose: "EMAIL_VERIFICATION",
			status: data.status,
			reason: data.reason || null,
			ipAddress: data.ipAddress || null,
			userAgent: data.userAgent || null,
		},
	});
}

// ============================================
// RESEND SERVICE FUNCTIONS
// ============================================

/**
 * Find any OTP session for email (active or inactive) - most recent first
 * Used to check if user has ANY verification history
 * @param prisma - Prisma client instance
 * @param email - Normalized email address
 * @returns Most recent session (any status) or null if never registered
 */
export async function findAnyOtpSession(
	prisma: PrismaClient | Prisma.TransactionClient,
	email: string,
): Promise<OtpSessionWithUser | null> {
	const normalizedEmail = email.toLowerCase().trim();

	return prisma.otpSession.findFirst({
		where: {
			email: normalizedEmail,
			purpose: "EMAIL_VERIFICATION",
		},
		include: {
			user: true,
			organization: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

/**
 * Find sessions with active locks across all user sessions
 * Global rate limiting - prevents circumventing locks via new sessions
 * @param prisma - Prisma client instance
 * @param email - Normalized email address
 * @returns Session with active lock or null if no locks found
 */
export async function findSessionsWithActiveLocks(
	prisma: PrismaClient | Prisma.TransactionClient,
	email: string,
): Promise<OtpSession | null> {
	const normalizedEmail = email.toLowerCase().trim();
	const now = new Date();

	return prisma.otpSession.findFirst({
		where: {
			email: normalizedEmail,
			purpose: "EMAIL_VERIFICATION",
			lockUntil: {
				gt: now,
			},
		},
		orderBy: {
			lockUntil: "desc", // Get the most restrictive lock
		},
	});
}

/**
 * Invalidate all tokens in a session by marking them consumed
 * Used for token rotation - prevents old codes from working after resend
 * @param prisma - Prisma transaction client
 * @param sessionId - OTP session ID
 */
export async function invalidateSessionTokens(
	prisma: Prisma.TransactionClient,
	sessionId: string,
): Promise<void> {
	const now = new Date();

	await prisma.otpToken.updateMany({
		where: {
			sessionId: sessionId,
			consumedAt: null, // Only invalidate unconsumed tokens
		},
		data: {
			consumedAt: now,
		},
	});
}

/**
 * Update session resend metadata (count and timing)
 * Used after successful resend to track abuse prevention metrics
 * @param prisma - Prisma transaction client
 * @param sessionId - OTP session ID
 * @param resendCount - New resend count
 * @param lastSentAt - When the resend was sent
 * @returns Updated OTP session
 */
export async function updateSessionResendMetadata(
	prisma: Prisma.TransactionClient,
	sessionId: string,
	resendCount: number,
	lastSentAt: Date,
): Promise<OtpSession> {
	return prisma.otpSession.update({
		where: { id: sessionId },
		data: {
			resendCount: resendCount,
			lastSentAt: lastSentAt,
		},
	});
}
