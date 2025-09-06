import type { Organization, Prisma, PrismaClient, Session, User } from "@prisma/client";
import { SESSION_EXPIRY_DAYS } from "../constants/registration.constants.js";

/**
 * Session repository helper functions
 * Data access layer for session-related operations
 */

/**
 * Type definition for session with user and organization relations
 */
export type SessionWithUser = Session & {
	user: User | null;
	organization: Organization | null;
};

/**
 * Create a new authentication session
 * @param prisma - Prisma transaction client
 * @param data - Session creation data
 * @returns Created session record
 */
export async function createSession(
	prisma: Prisma.TransactionClient,
	data: {
		userId: string;
		organizationId: string;
		tokenHash: string;
		tokenLastFour: string;
		ipAddress?: string;
		userAgent?: string;
	},
): Promise<Session> {
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

	return prisma.session.create({
		data: {
			userId: data.userId,
			organizationId: data.organizationId,
			tokenHash: data.tokenHash,
			tokenLastFour: data.tokenLastFour,
			ipAddress: data.ipAddress || null,
			userAgent: data.userAgent || null,
			lastActivity: now,
			expiresAt: expiresAt,
		},
	});
}

/**
 * Find session by token hash for authentication
 * @param prisma - Prisma client instance
 * @param tokenHash - SHA256 hash of session token
 * @returns Session with user and organization or null if not found
 */
export async function findSessionByTokenHash(
	prisma: PrismaClient | Prisma.TransactionClient,
	tokenHash: string,
): Promise<SessionWithUser | null> {
	return prisma.session.findUnique({
		where: { tokenHash: tokenHash },
		include: {
			user: true,
			organization: true,
		},
	});
}

/**
 * Update session activity timestamp for keepalive
 * @param prisma - Prisma client instance
 * @param sessionId - Session ID to update
 * @returns Updated session
 */
export async function updateSessionActivity(
	prisma: PrismaClient | Prisma.TransactionClient,
	sessionId: string,
): Promise<Session> {
	const now = new Date();

	return prisma.session.update({
		where: { id: sessionId },
		data: {
			lastActivity: now,
		},
	});
}

/**
 * Revoke a single session with reason
 * @param prisma - Prisma transaction client
 * @param sessionId - Session ID to revoke
 * @param reason - Reason for revocation ("logout", "security", "password_changed")
 * @returns Revoked session
 */
export async function revokeSession(
	prisma: Prisma.TransactionClient,
	sessionId: string,
	reason: string,
): Promise<Session> {
	const now = new Date();

	return prisma.session.update({
		where: { id: sessionId },
		data: {
			revokedAt: now,
			revokedReason: reason,
		},
	});
}

/**
 * Revoke all active sessions for a user
 * Used for password changes, security incidents, etc.
 * @param prisma - Prisma transaction client
 * @param userId - User ID whose sessions to revoke
 * @param reason - Reason for bulk revocation
 * @returns Count of revoked sessions
 */
export async function revokeUserSessions(
	prisma: Prisma.TransactionClient,
	userId: string,
	reason: string,
): Promise<number> {
	const now = new Date();

	const result = await prisma.session.updateMany({
		where: {
			userId: userId,
			revokedAt: null, // Only revoke active sessions
		},
		data: {
			revokedAt: now,
			revokedReason: reason,
		},
	});

	return result.count;
}

/**
 * Revoke all active sessions for a user EXCEPT the specified session
 * Used for password changes where current session should remain active
 * @param prisma - Prisma transaction client
 * @param userId - User ID whose sessions to revoke
 * @param currentSessionId - Session ID to keep active
 * @param reason - Reason for bulk revocation
 * @returns Count of revoked sessions
 */
export async function revokeUserSessionsExcept(
	prisma: Prisma.TransactionClient,
	userId: string,
	currentSessionId: string,
	reason: string,
): Promise<number> {
	const now = new Date();

	const result = await prisma.session.updateMany({
		where: {
			userId: userId,
			revokedAt: null, // Only revoke active sessions
			NOT: {
				id: currentSessionId, // Exclude current session
			},
		},
		data: {
			revokedAt: now,
			revokedReason: reason,
		},
	});

	return result.count;
}

/**
 * Find session by token hash with minimal data for authentication middleware
 * Optimized query for performance - only loads essential auth validation fields
 * @param prisma - Prisma client instance
 * @param tokenHash - SHA256 hash of session token
 * @returns Session with minimal user and organization data or null if not found
 */
export async function findSessionForAuth(
	prisma: PrismaClient | Prisma.TransactionClient,
	tokenHash: string,
) {
	return prisma.session.findUnique({
		where: { tokenHash },
		include: {
			user: {
				select: {
					id: true,
					verified: true,
					isLocked: true,
				},
			},
			organization: {
				select: {
					id: true,
					deletedAt: true,
				},
			},
		},
	});
}

/**
 * Find session by ID for profile endpoints
 * Returns session details needed for /me response
 * @param prisma - Prisma client instance
 * @param sessionId - Session ID to look up
 * @returns Session with essential fields or null if not found
 */
export async function findSessionById(
	prisma: PrismaClient | Prisma.TransactionClient,
	sessionId: string,
): Promise<{
	id: string;
	expiresAt: Date;
	lastActivity: Date;
	tokenLastFour: string;
} | null> {
	return prisma.session.findUnique({
		where: { id: sessionId },
		select: {
			id: true,
			expiresAt: true,
			lastActivity: true,
			tokenLastFour: true,
		},
	});
}
