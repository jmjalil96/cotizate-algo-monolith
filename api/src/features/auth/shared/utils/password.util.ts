import bcrypt from "bcryptjs";
import { PASSWORD_SALT_ROUNDS } from "../constants/registration.constants.js";

/**
 * Password utility functions
 * Handles password hashing and verification
 */

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}
