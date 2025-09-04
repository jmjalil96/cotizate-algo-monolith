import type { Request, Response } from "express";
import { env } from "../../../../config/env.js";
import { AUTH_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "../constants/registration.constants.js";

/**
 * Cookie utility functions
 * Handles secure cookie management for authentication
 */

/**
 * Set secure HTTP-only authentication cookie
 * @param res - Express response object
 * @param token - Raw session token to set in cookie
 * @param expiresAt - When the session expires
 */
export function setAuthCookie(res: Response, token: string, _expiresAt: Date): void {
	const maxAgeMs = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 30 days in milliseconds

	res.cookie(AUTH_COOKIE_NAME, token, {
		httpOnly: true, // Prevent XSS attacks
		secure: env.NODE_ENV === "production", // HTTPS only in production
		sameSite: "strict", // CSRF protection
		maxAge: maxAgeMs, // Cookie expiry (30 days)
		path: "/", // Available for entire application
	});
}

/**
 * Clear authentication cookie on logout
 * @param res - Express response object
 */
export function clearAuthCookie(res: Response): void {
	res.clearCookie(AUTH_COOKIE_NAME, {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
	});
}

/**
 * Extract authentication token from request cookies
 * @param req - Express request object
 * @returns Session token or null if not found
 */
export function getAuthTokenFromCookie(req: Request): string | null {
	return req.cookies?.[AUTH_COOKIE_NAME] || null;
}
