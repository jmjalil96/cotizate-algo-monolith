import { createHash, randomBytes } from "node:crypto";
import { SESSION_TOKEN_BYTES } from "../constants/registration.constants.js";

/**
 * Session token utility functions
 * Handles session token generation, hashing, and formatting
 */

/**
 * Generate a secure random session token
 * @returns Base64-encoded secure random token
 */
export function generateSessionToken(): string {
	const tokenBytes = randomBytes(SESSION_TOKEN_BYTES);
	return tokenBytes.toString("base64url"); // URL-safe base64
}

/**
 * Hash a session token using SHA-256
 * @param token - Plain session token to hash
 * @returns Hashed token as hex string
 */
export function hashSessionToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

/**
 * Extract last 4 characters from token for UI display
 * @param token - Plain session token
 * @returns Last 4 characters for user-friendly display ("...x7Kp")
 */
export function getTokenLastFour(token: string): string {
	return token.slice(-4);
}
