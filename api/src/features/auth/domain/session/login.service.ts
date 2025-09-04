import type { PrismaClient } from "@prisma/client";
import type { Response } from "express";
import { logger } from "../../../../config/logger.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { createSession } from "../../shared/repositories/session.repository.js";
import {
	findUserForLogin,
	incrementUserLoginAttempts,
	resetUserLoginAttempts,
	updateUserLastLogin,
} from "../../shared/repositories/user.repository.js";
import type { LoginInput, LoginResult } from "../../shared/types/registration.types.js";
import { setAuthCookie } from "../../shared/utils/cookie.util.js";
import { verifyPassword } from "../../shared/utils/password.util.js";
import { flattenUserPermissions } from "../../shared/utils/permission.util.js";
import {
	generateSessionToken,
	getTokenLastFour,
	hashSessionToken,
} from "../../shared/utils/session.util.js";
import {
	accountLocked,
	accountNotVerified,
	invalidCredentials,
	organizationInactive,
} from "./session.errors.js";

/**
 * Login Service
 * Handles user authentication with credential validation, session management,
 * and security features including login attempt tracking and account locking.
 *
 * Core Responsibility: Authenticate users and create secure sessions
 *
 * Key Security Features:
 * - Password verification with bcrypt
 * - Login attempt tracking (5 max attempts before permanent lock)
 * - Account locking after failed attempts (unlocked only by password reset)
 * - Session creation with custom tokens and device tracking
 * - Comprehensive audit logging for security monitoring
 */

export class LoginService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main login method - handles complete authentication flow
	 * @param loginData - Email and password with request context
	 * @returns Login result with session token and user data
	 *
	 * LOGIN FLOW STEPS:
	 * 1. Find user by email → FAIL if not found
	 * 2. Check user verification status → FAIL if not verified
	 * 3. Check account lock status → FAIL if locked (permanent until password reset)
	 * 4. Check organization status → FAIL if organization deleted/inactive
	 * 5. Verify password → FAIL + increment attempts if wrong (lock at 5 attempts)
	 * 6. Reset login attempts on success
	 * 7. Create new session with JWT token and device tracking
	 * 8. Update last login timestamp
	 * 9. Set secure HTTP-only cookie with JWT
	 * 10. Create audit log for successful login
	 * 11. Return user data and session info
	 */
	async login(loginData: LoginInput, res: Response): Promise<LoginResult> {
		const { email, password, ipAddress, userAgent, requestId } = loginData;

		// Log login attempt
		logger.info(
			{
				email: email,
				ipAddress,
				requestId,
			},
			"Login attempt",
		);

		try {
			// STEP 1 - Find user by email with complete context (normalizes internally)
			const user = await findUserForLogin(this.prisma, email);
			if (!user) {
				logger.warn(
					{
						email: email,
						ipAddress,
						requestId,
					},
					"Login failed - user not found",
				);
				throw invalidCredentials();
			}

			// STEP 2 - Check user verification status
			if (!user.verified) {
				logger.warn(
					{
						userId: user.id,
						email: email,
						ipAddress,
						requestId,
					},
					"Login failed - account not verified",
				);
				throw accountNotVerified();
			}

			// STEP 3 - Check account lock status
			if (user.isLocked) {
				logger.warn(
					{
						userId: user.id,
						email: email,
						loginAttempts: user.loginAttempts,
						ipAddress,
						requestId,
					},
					"Login failed - account locked",
				);
				throw accountLocked();
			}

			// STEP 4 - Check organization status
			if (user.organization.deletedAt) {
				logger.warn(
					{
						userId: user.id,
						email: email,
						organizationId: user.organizationId,
						ipAddress,
						requestId,
					},
					"Login failed - organization inactive",
				);
				throw organizationInactive();
			}

			// STEP 5 - Verify password hash
			const isValidPassword = await verifyPassword(password, user.password);
			if (!isValidPassword) {
				// Increment attempts and check for lock
				await incrementUserLoginAttempts(this.prisma, user.id, user.loginAttempts);

				// Create audit log for failed attempt
				await this.prisma.auditLog.create({
					data: {
						userId: user.id,
						organizationId: user.organizationId,
						action: "LOGIN_FAILED",
						resource: "USER",
						resourceId: user.id,
						ipAddress: ipAddress || null,
						userAgent: userAgent || null,
						metadata: {
							email: email,
							reason: "INVALID_PASSWORD",
							attempts: user.loginAttempts + 1,
							requestId,
						},
					},
				});

				logger.warn(
					{
						userId: user.id,
						email: email,
						loginAttempts: user.loginAttempts + 1,
						ipAddress,
						requestId,
					},
					"Login failed - invalid password",
				);

				throw invalidCredentials();
			}

			// STEPS 6-11: SUCCESS FLOW - Transaction required
			const result = await this.prisma.$transaction(async (tx) => {
				// STEP 6 - Reset login attempts on success
				await resetUserLoginAttempts(tx, user.id);

				// STEP 7 - Create session with custom token
				const rawToken = generateSessionToken();
				const tokenHash = hashSessionToken(rawToken);
				const tokenLastFour = getTokenLastFour(rawToken);

				const session = await createSession(tx, {
					userId: user.id,
					organizationId: user.organizationId,
					tokenHash,
					tokenLastFour,
					ipAddress,
					userAgent,
				});

				// STEP 8 - Update user last login timestamp
				await updateUserLastLogin(tx, user.id);

				// STEP 10 - Create audit log for successful login
				await tx.auditLog.create({
					data: {
						userId: user.id,
						organizationId: user.organizationId,
						action: "LOGIN",
						resource: "USER",
						resourceId: user.id,
						ipAddress: ipAddress || null,
						userAgent: userAgent || null,
						metadata: {
							email: email,
							sessionId: session.id,
							deviceInfo: { ipAddress, userAgent },
							requestId,
						},
					},
				});

				// STEP 9 - Set secure HTTP-only cookie
				setAuthCookie(res, rawToken, session.expiresAt);

				// STEP 11 - Prepare response data
				return {
					success: true,
					message: "Login successful",
					user: {
						id: user.id,
						email: user.email,
						verified: user.verified,
						profile: {
							firstName: user.profile?.firstName || "",
							lastName: user.profile?.lastName || "",
						},
						organization: {
							id: user.organization.id,
							name: user.organization.name,
							slug: user.organization.slug,
						},
						permissions: flattenUserPermissions(user),
					},
					session: {
						id: session.id,
						expiresAt: session.expiresAt,
						lastActivity: session.lastActivity,
						tokenLastFour: session.tokenLastFour,
					},
				};
			});

			// Log successful login
			logger.info(
				{
					userId: user.id,
					email: email,
					organizationId: user.organizationId,
					sessionId: result.session.id,
					permissions: result.user.permissions,
					ipAddress,
					requestId,
				},
				"Login completed successfully",
			);

			return result;
		} catch (error) {
			// Log internal errors (but not expected business errors)
			if (!(error instanceof AppError)) {
				logger.error(
					{
						email: email,
						ipAddress,
						requestId,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during login",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}
}
