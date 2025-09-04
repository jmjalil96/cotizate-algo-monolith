import { createHash, randomInt } from "node:crypto";
import { OTP_LENGTH } from "../constants/registration.constants.js";

/**
 * OTP utility functions
 * Handles OTP generation, hashing, and verification
 */

/**
 * Generate a random numeric OTP
 * @returns Generated OTP string
 */
export function generateOTP(): string {
	const min = 10 ** (OTP_LENGTH - 1); // 100000 for 6 digits
	const max = 10 ** OTP_LENGTH - 1; // 999999 for 6 digits
	const otp = randomInt(min, max + 1);
	return otp.toString();
}

/**
 * Hash an OTP using SHA-256
 * @param otp - Plain OTP to hash
 * @returns Hashed OTP as hex string
 */
export function hashOTP(otp: string): string {
	return createHash("sha256").update(otp).digest("hex");
}

/**
 * Verify an OTP against its hash
 * @param otp - Plain OTP to verify
 * @param hash - Stored OTP hash
 * @returns True if OTP matches, false otherwise
 */
export function verifyOTP(otp: string, hash: string): boolean {
	const otpHash = hashOTP(otp);
	// Constant-time comparison to prevent timing attacks
	return otpHash === hash;
}
