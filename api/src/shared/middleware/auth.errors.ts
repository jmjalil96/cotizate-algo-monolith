import { AppError } from "../errors/AppError.js";

/**
 * Lightweight authentication middleware error functions
 * Minimal set of errors for session validation only
 */

// ============================================
// AUTHENTICATION ERRORS (401 - Clear cookie)
// ============================================

/**
 * No authentication token provided
 */
export const authenticationRequired = () =>
	new AppError("Authentication required", 401, true, "AUTH_REQUIRED");

/**
 * Invalid or malformed session token
 */
export const invalidSession = () => new AppError("Invalid session", 401, true, "SESSION_INVALID");

/**
 * Session has expired
 */
export const sessionExpired = () => new AppError("Session expired", 401, true, "SESSION_EXPIRED");

/**
 * Session was terminated/revoked
 */
export const sessionRevoked = () =>
	new AppError("Session terminated", 401, true, "SESSION_REVOKED");

// ============================================
// AUTHORIZATION ERRORS (403 - Keep session)
// ============================================

/**
 * Account needs email verification
 */
export const emailNotVerified = () =>
	new AppError("Email verification required", 403, true, "EMAIL_NOT_VERIFIED");

/**
 * Account is locked due to failed login attempts
 */
export const accountLocked = () => new AppError("Account locked", 403, true, "ACCOUNT_LOCKED");

/**
 * Organization is inactive/deleted
 */
export const organizationInactive = () =>
	new AppError("Organization inactive", 403, true, "ORG_INACTIVE");

// ============================================
// SERVER ERRORS (500 - Data integrity issues)
// ============================================

/**
 * Data integrity error - session missing required relations
 */
export const dataIntegrityError = () =>
	new AppError("Authentication data integrity error", 500, false, "DATA_INTEGRITY_ERROR");
