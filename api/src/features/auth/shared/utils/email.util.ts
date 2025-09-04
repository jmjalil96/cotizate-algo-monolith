import { env } from "../../../../config/env.js";
import { logger } from "../../../../config/logger.js";

/**
 * Email utility functions for authentication flows
 */

/**
 * Log OTP code in development environment
 * Used for testing without actually sending emails
 * @param email - Recipient email address
 * @param otpCode - Generated OTP code
 * @param expiresAt - When the OTP expires
 * @param context - Context of OTP generation (registration, resend, etc.)
 */
export function logOtpInDevelopment(
	email: string,
	otpCode: string,
	expiresAt: Date,
	context: "registration" | "resend" | "password_reset",
): void {
	if (env.NODE_ENV === "development") {
		logger.info(
			{
				email,
				otpCode,
				expiresAt,
			},
			`OTP generated for ${context}`,
		);
	}
}

/**
 * Future email sending functions can be added here
 * e.g., sendOtpEmail, sendWelcomeEmail, etc.
 */
