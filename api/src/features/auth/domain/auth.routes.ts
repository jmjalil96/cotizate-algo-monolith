import { Router } from "express";
import { prisma } from "../../../db/client.js";
import { authenticate } from "../../../shared/middleware/auth.middleware.js";
import { validate } from "../../../shared/middleware/validator.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { createAuthServices } from "../shared/factories/auth.factory.js";
import { ProfileController } from "./profile/profile.controller.js";
import { RegistrationController } from "./registration/registration.controller.js";
import {
	registerRequestSchema,
	resendCodeRequestSchema,
	verifyEmailRequestSchema,
} from "./registration/registration.dto.js";
import { SessionController } from "./session/session.controller.js";
import { loginRequestSchema, logoutRequestSchema } from "./session/session.dto.js";

/**
 * Auth Routes
 * Defines all authentication-related endpoints
 */
const router = Router();

// Initialize services and controllers using factory pattern
const authServices = createAuthServices(prisma);
const registrationController = new RegistrationController(authServices);
const sessionController = new SessionController(authServices);
const profileController = new ProfileController(authServices);

/**
 * POST /api/v1/auth/register
 * Register a new user with organization
 *
 * Request body:
 * - firstName: string
 * - lastName: string
 * - email: string
 * - password: string
 * - organizationName: string
 *
 * Response 201:
 * - otpExpiresAt: string (ISO date when OTP expires)
 *
 * Error responses:
 * - 400: Validation failed
 * - 403: Email not verified (with code: EMAIL_NOT_VERIFIED)
 * - 409: Email already registered
 * - 404: Owner role not found (system configuration error)
 * - 500: Internal server error
 */
router.post(
	"/register",
	validate({ body: registerRequestSchema }),
	asyncHandler(async (req, res) => {
		await registrationController.register(req, res);
	}),
);

/**
 * POST /api/v1/auth/verify-email
 * Verify user email with OTP code
 *
 * Request body:
 * - email: string
 * - otpCode: string (6-digit numeric)
 *
 * Response 200:
 * - success: boolean
 * - message: string
 *
 * Error responses:
 * - 400: Invalid code, expired, no session, etc.
 * - 429: Too many attempts (session locked)
 * - 500: Internal server error
 */
router.post(
	"/verify-email",
	validate({ body: verifyEmailRequestSchema }),
	asyncHandler(async (req, res) => {
		await registrationController.verifyEmail(req, res);
	}),
);

/**
 * POST /api/v1/auth/resend-code
 * Resend OTP verification code
 *
 * Request body:
 * - email: string
 *
 * Response 200:
 * - success: boolean
 * - message: string
 * - otpExpiresAt: string (when new OTP sent)
 *
 * Error responses:
 * - 400: No session, too many resends, etc.
 * - 429: Rate limited (with Retry-After header) or session locked (with Retry-After header)
 * - 500: Internal server error
 */
router.post(
	"/resend-code",
	validate({ body: resendCodeRequestSchema }),
	asyncHandler(async (req, res) => {
		await registrationController.resendCode(req, res);
	}),
);

/**
 * POST /api/v1/auth/login
 * Authenticate user and create session
 *
 * Request body:
 * - email: string
 * - password: string
 *
 * Response 200:
 * - success: boolean
 * - message: string
 * - user: object (id, email, profile, organization, permissions)
 * - session: object (id, expiresAt, lastActivity, tokenLastFour)
 *
 * Sets HTTP-only cookie: sessionToken
 *
 * Error responses:
 * - 401: Invalid credentials or account locked
 * - 403: Account not verified or organization inactive
 * - 500: Internal server error
 */
router.post(
	"/login",
	validate({ body: loginRequestSchema }),
	asyncHandler(async (req, res) => {
		await sessionController.login(req, res);
	}),
);

/**
 * POST /api/v1/auth/logout
 * Terminate user session(s) and clear cookie
 *
 * Request body:
 * - everywhere: boolean (optional - if true, revoke all user sessions)
 *
 * Response 200:
 * - success: boolean (always true - idempotent)
 * - message: string
 * - sessionsRevoked: number (count of sessions terminated)
 *
 * Clears HTTP-only cookie: sessionToken
 * Always returns 200 (idempotent design)
 *
 * Note: No error responses - logout always succeeds for security
 */
router.post(
	"/logout",
	validate({ body: logoutRequestSchema }),
	asyncHandler(async (req, res) => {
		await sessionController.logout(req, res);
	}),
);

/**
 * GET /api/v1/auth/me
 * Get current user profile and session data
 *
 * Requires: Valid session token in HTTP-only cookie
 *
 * Response 200:
 * - user: object (id, email, profile, organization, permissions)
 * - session: object (id, expiresAt, lastActivity, tokenLastFour)
 *
 * Error responses:
 * - 401: Authentication required (no valid session)
 * - 404: User or session not found (data integrity issue)
 * - 500: Internal server error
 */
router.get(
	"/me",
	authenticate,
	asyncHandler(async (req, res) => {
		await profileController.getMe(req, res);
	}),
);

// Future endpoints can be added here:
// router.post("/login", validate({ body: loginRequestSchema }), asyncHandler(loginController.login));
// router.post("/verify-otp", validate({ body: verifyOtpRequestSchema }), asyncHandler(verifyController.verifyOtp));
// router.post("/resend-otp", validate({ body: resendOtpRequestSchema }), asyncHandler(verifyController.resendOtp));
// router.post("/forgot-password", validate({ body: forgotPasswordRequestSchema }), asyncHandler(passwordController.forgotPassword));
// router.post("/reset-password", validate({ body: resetPasswordRequestSchema }), asyncHandler(passwordController.resetPassword));
// router.post("/logout", authenticate, asyncHandler(authController.logout));
// router.post("/refresh", validate({ body: refreshTokenRequestSchema }), asyncHandler(authController.refresh));

export { router as authRoutes };
