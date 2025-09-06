import { AppError } from "../../../../shared/errors/AppError.js";

/**
 * Password reset domain specific error functions
 * Contextually appropriate error handlers for the password reset flow
 * Same logic as verification errors but with password reset messaging
 */

// ============================================
// PASSWORD RESET ERRORS
// ============================================

/**
 * Path 1: No active password reset session found
 * User needs to request password reset first
 */
export const noActivePasswordResetSession = () =>
	new AppError(
		"No active password reset session. Please request password reset.",
		400,
		true,
		"NO_ACTIVE_RESET_SESSION",
	);

/**
 * Path 2: Password reset session has expired (>24 hours)
 * User needs to request a new password reset
 */
export const passwordResetSessionExpired = () =>
	new AppError(
		"Password reset session expired. Please request a new password reset.",
		400,
		true,
		"RESET_SESSION_EXPIRED",
	);

/**
 * Path 3: Session locked due to too many failed attempts
 * User must wait for cooldown period before retrying
 */
export const passwordResetSessionLocked = (retryAfter: Date) => {
	const waitSeconds = Math.max(0, Math.ceil((retryAfter.getTime() - Date.now()) / 1000));
	return new AppError(
		`Too many failed attempts. Try again in ${waitSeconds} seconds.`,
		429,
		true,
		"RESET_SESSION_LOCKED",
		{ waitSeconds },
	);
};

/**
 * Path 4: No valid password reset codes available
 * User needs to request a new password reset
 */
export const noValidPasswordResetCode = () =>
	new AppError(
		"No valid reset code available. Please request a new password reset.",
		400,
		true,
		"NO_VALID_RESET_CODE",
	);

/**
 * Path 5: Password reset code has expired (>15 minutes)
 * User needs to request a new password reset
 */
export const passwordResetCodeExpired = () =>
	new AppError(
		"Reset code expired. Please request a new password reset.",
		400,
		true,
		"RESET_CODE_EXPIRED",
	);

/**
 * Path 6: Invalid password reset code provided
 * User can retry with correct code (if attempts remaining)
 */
export const invalidPasswordResetCode = (attemptsRemaining: number) =>
	new AppError(
		`Invalid reset code. ${attemptsRemaining} attempts remaining.`,
		400,
		true,
		"INVALID_RESET_CODE",
	);

// ============================================
// CHANGE PASSWORD ERRORS
// ============================================

/**
 * Invalid current password provided during password change
 * User must provide correct current password to change it
 */
export const invalidCurrentPassword = () =>
	new AppError("Current password is incorrect", 400, true, "INVALID_CURRENT_PASSWORD");
