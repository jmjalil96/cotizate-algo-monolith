import type { RequestHandler } from "express";
import { prisma } from "../../db/client.js";
import { SESSION_ACTIVITY_UPDATE_THRESHOLD_MINUTES } from "../../features/auth/shared/constants/registration.constants.js";
import {
	findSessionForAuth,
	updateSessionActivity,
} from "../../features/auth/shared/repositories/session.repository.js";
import {
	clearAuthCookie,
	getAuthTokenFromCookie,
} from "../../features/auth/shared/utils/cookie.util.js";
import { hashSessionToken } from "../../features/auth/shared/utils/session.util.js";
import { AppError } from "../errors/AppError.js";
import { extractRequestContext } from "../utils/request.util.js";
import {
	accountLocked,
	authenticationRequired,
	dataIntegrityError,
	emailNotVerified,
	invalidSession,
	organizationInactive,
	sessionExpired,
	sessionRevoked,
} from "./auth.errors.js";

/**
 * Lightweight Authentication Middleware
 * Validates session tokens and sets minimal auth context on requests.
 * Business logic endpoints load additional data as needed.
 *
 * Fast validation flow:
 * 1. Extract session token from cookies
 * 2. Hash token and lookup session with minimal user/org data
 * 3. Validate session (not revoked, not expired)
 * 4. Validate user (verified, not locked)
 * 5. Validate organization (active)
 * 6. Set minimal auth context: req.auth = { userId, sessionId, organizationId }
 * 7. Update session activity (throttled)
 *
 * No heavy queries - business logic loads permissions/profile as needed
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Comprehensive authentication security validation required
export const authenticate: RequestHandler = async (req, res, next) => {
	const { ipAddress, userAgent } = extractRequestContext(req);

	try {
		// STEP 1: Extract session token from cookie
		const token = getAuthTokenFromCookie(req);
		if (!token) {
			req.log?.debug(
				{
					ipAddress,
					userAgent,
				},
				"No session token in request",
			);
			throw authenticationRequired();
		}

		// STEP 2: Hash token and find session (minimal query)
		const tokenHash = hashSessionToken(token);
		const session = await findSessionForAuth(prisma, tokenHash);

		if (!session) {
			clearAuthCookie(res);
			req.log?.warn(
				{
					tokenLastFour: token.slice(-4),
					ipAddress,
					userAgent,
				},
				"Invalid session token attempt",
			);
			throw invalidSession();
		}

		// STEP 3: Session validation
		const now = new Date();

		if (session.revokedAt !== null) {
			clearAuthCookie(res);
			req.log?.info(
				{
					sessionId: session.id,
					userId: session.userId,
					ipAddress,
					userAgent,
				},
				"Revoked session access attempt",
			);
			throw sessionRevoked();
		}

		if (session.expiresAt < now) {
			clearAuthCookie(res);
			req.log?.info(
				{
					sessionId: session.id,
					userId: session.userId,
					expiresAt: session.expiresAt,
					ipAddress,
					userAgent,
				},
				"Expired session access attempt",
			);
			throw sessionExpired();
		}

		// STEP 4: User validation (basic checks only)
		if (!session.user) {
			clearAuthCookie(res);
			req.log?.error(
				{
					sessionId: session.id,
				},
				"Session missing user reference - data integrity issue",
			);
			throw dataIntegrityError();
		}

		if (!session.user.verified) {
			req.log?.warn(
				{
					sessionId: session.id,
					userId: session.userId,
					ipAddress,
					userAgent,
				},
				"Unverified user access attempt",
			);
			throw emailNotVerified();
		}

		if (session.user.isLocked) {
			req.log?.warn(
				{
					sessionId: session.id,
					userId: session.userId,
					ipAddress,
					userAgent,
				},
				"Locked account access attempt",
			);
			throw accountLocked();
		}

		// STEP 5: Organization validation
		if (!session.organization) {
			clearAuthCookie(res);
			req.log?.error(
				{
					sessionId: session.id,
				},
				"Session missing organization reference - data integrity issue",
			);
			throw dataIntegrityError();
		}

		if (session.organization.deletedAt !== null) {
			req.log?.warn(
				{
					sessionId: session.id,
					userId: session.userId,
					organizationId: session.organizationId,
					ipAddress,
					userAgent,
				},
				"Inactive organization access attempt",
			);
			throw organizationInactive();
		}

		// STEP 6: Set minimal auth context
		req.auth = {
			userId: session.userId,
			sessionId: session.id,
			organizationId: session.organizationId,
		};

		// STEP 7: Update session activity (throttled for performance)
		const lastActivityThreshold = SESSION_ACTIVITY_UPDATE_THRESHOLD_MINUTES * 60 * 1000;
		const timeSinceActivity = now.getTime() - session.lastActivity.getTime();

		if (timeSinceActivity >= lastActivityThreshold) {
			// Update in background, don't block request
			updateSessionActivity(prisma, session.id).catch((err) =>
				req.log?.error(
					{
						sessionId: session.id,
						error: err instanceof Error ? err.message : String(err),
					},
					"Failed to update session activity",
				),
			);
		}

		req.log?.debug(
			{
				userId: session.userId,
				sessionId: session.id,
				ipAddress,
				userAgent,
			},
			"Request authenticated",
		);

		next();
	} catch (error) {
		// Clear cookie on authentication failures (401 errors)
		if (error instanceof AppError && error.statusCode === 401) {
			clearAuthCookie(res);
		}

		// Log only unexpected, server-side errors
		const isClientError = error instanceof AppError && error.statusCode < 500;
		if (!isClientError) {
			req.log?.error(
				{
					ipAddress,
					userAgent,
					error: error instanceof Error ? error.message : String(error),
				},
				"Internal error during authentication",
			);
		}

		next(error);
	}
};
