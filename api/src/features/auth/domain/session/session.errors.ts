import { AppError } from "../../../../shared/errors/AppError.js";

/**
 * Session domain specific error functions
 * Authentication and session management error handlers
 */

// ============================================
// AUTHENTICATION ERRORS
// ============================================

/**
 * Generic authentication failure (security-focused)
 * Used for both "user not found" and "wrong password" to prevent user enumeration
 * Never reveals whether the email exists or if the password is wrong
 */
export const invalidCredentials = () =>
	new AppError("Invalid email or password.", 401, true, "INVALID_CREDENTIALS");

/**
 * Account locked after too many failed login attempts
 * Permanent lock until password reset (no time-based unlock)
 */
export const accountLocked = () =>
	new AppError(
		"Account locked due to too many failed login attempts. Please reset your password to unlock.",
		401,
		true,
		"ACCOUNT_LOCKED",
	);

/**
 * User account not verified
 * Must complete email verification before login is allowed
 */
export const accountNotVerified = () =>
	new AppError(
		"Email not verified. Please check your email and verify your account.",
		403,
		true,
		"ACCOUNT_NOT_VERIFIED",
	);

/**
 * Organization inactive or deleted
 * User's organization has been deactivated or removed
 */
export const organizationInactive = () =>
	new AppError(
		"Organization is inactive. Please contact support for assistance.",
		403,
		true,
		"ORGANIZATION_INACTIVE",
	);

// ============================================
// SESSION MANAGEMENT ERRORS (for future use)
// ============================================

/**
 * Session not found or expired
 * Used in authentication middleware when token is invalid
 */
export const sessionInvalid = () =>
	new AppError("Session expired or invalid. Please log in again.", 401, true, "SESSION_INVALID");

/**
 * Session revoked
 * Used when session was explicitly terminated
 */
export const sessionRevoked = (reason: string) =>
	new AppError(`Session terminated: ${reason}. Please log in again.`, 401, true, "SESSION_REVOKED");
