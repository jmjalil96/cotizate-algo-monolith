import { AppError } from "../../../../shared/errors/AppError.js";

/**
 * Registration domain specific error functions
 * Email verification error handlers for the 7 verification paths
 */

// ============================================
// EMAIL VERIFICATION ERRORS
// ============================================

/**
 * Path 1: No active verification session found
 * User needs to register or request a new code
 */
export const noActiveVerificationSession = () =>
	new AppError(
		"No active verification session. Please register or request a new code.",
		400,
		true,
		"NO_ACTIVE_SESSION",
	);

/**
 * Path 2: Verification session has expired (>24 hours)
 * User needs to request a new code via resend endpoint
 */
export const verificationSessionExpired = () =>
	new AppError(
		"Verification session expired. Please request a new code.",
		400,
		true,
		"SESSION_EXPIRED",
	);

/**
 * Path 3: Session locked due to too many failed attempts
 * User must wait for cooldown period before retrying
 */
export const verificationSessionLocked = (retryAfter: Date) => {
	const waitSeconds = Math.max(0, Math.ceil((retryAfter.getTime() - Date.now()) / 1000));
	return new AppError(
		`Too many failed attempts. Try again in ${waitSeconds} seconds.`,
		429,
		true,
		"SESSION_LOCKED",
		{ waitSeconds },
	);
};

/**
 * Path 4: No valid verification tokens available
 * User needs to request a new code via resend endpoint
 */
export const noValidVerificationCode = () =>
	new AppError("No valid code available. Please request a new code.", 400, true, "NO_VALID_CODE");

/**
 * Path 5: Verification code has expired (>15 minutes)
 * User needs to request a new code via resend endpoint
 */
export const verificationCodeExpired = () =>
	new AppError("Code expired. Please request a new code.", 400, true, "CODE_EXPIRED");

/**
 * Path 6: Invalid verification code provided
 * User can retry with correct code (if attempts remaining)
 */
export const invalidVerificationCode = (attemptsRemaining: number) =>
	new AppError(`Invalid code. ${attemptsRemaining} attempts remaining.`, 400, true, "INVALID_CODE");

// ============================================
// REGISTRATION ERRORS (for future use)
// ============================================

/**
 * User already verified - cannot verify again
 * Should return success for idempotency
 */
export const userAlreadyVerified = (email: string) =>
	new AppError(`User ${email} is already verified.`, 400, true, "USER_ALREADY_VERIFIED");

// ============================================
// RESEND ERRORS
// ============================================

/**
 * Path 1: No session exists - user never registered
 * Direct user to registration endpoint
 */
export const noVerificationSession = () =>
	new AppError(
		"No verification session found. Please register first.",
		400,
		true,
		"NO_VERIFICATION_SESSION",
	);

/**
 * Path 4: Too many resends in current session (5 max)
 * Prevent cost abuse from excessive email sending
 */
export const tooManyResends = () =>
	new AppError(
		"Too many resend attempts. Please wait or contact support.",
		400,
		true,
		"TOO_MANY_RESENDS",
	);

/**
 * Path 5: Rate limiting - too soon since last send (60s cooldown)
 * Anti-spam protection with specific wait time
 */
export const resendRateLimited = (waitSeconds: number) =>
	new AppError(
		`Please wait ${waitSeconds} seconds before requesting another code.`,
		429,
		true,
		"RESEND_RATE_LIMITED",
		{ waitSeconds },
	);
