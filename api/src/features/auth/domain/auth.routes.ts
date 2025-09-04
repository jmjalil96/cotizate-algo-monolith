import { Router } from "express";
import { prisma } from "../../../db/client.js";
import { validate } from "../../../shared/middleware/validator.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { createAuthServices } from "../shared/factories/auth.factory.js";
import { RegistrationController } from "./registration/registration.controller.js";
import {
	registerRequestSchema,
	resendCodeRequestSchema,
	verifyEmailRequestSchema,
} from "./registration/registration.dto.js";
import { SessionController } from "./session/session.controller.js";
import { loginRequestSchema } from "./session/session.dto.js";

/**
 * Auth Routes
 * Defines all authentication-related endpoints
 */
const router = Router();

// Initialize services and controllers using factory pattern
const authServices = createAuthServices(prisma);
const registrationController = new RegistrationController(authServices);
const sessionController = new SessionController(authServices);

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
 * - sessionToken: string (UUID for OTP verification)
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
 * - otpExpiresAt: string (optional - when new OTP expires)
 * - waitSeconds: number (optional - seconds to wait on rate limit)
 * - retryAfter: string (optional - when can retry if locked)
 *
 * Error responses:
 * - 400: No session, too many resends, etc.
 * - 429: Rate limited or session locked
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

// Future endpoints can be added here:
// router.post("/login", validate({ body: loginRequestSchema }), asyncHandler(loginController.login));
// router.post("/verify-otp", validate({ body: verifyOtpRequestSchema }), asyncHandler(verifyController.verifyOtp));
// router.post("/resend-otp", validate({ body: resendOtpRequestSchema }), asyncHandler(verifyController.resendOtp));
// router.post("/forgot-password", validate({ body: forgotPasswordRequestSchema }), asyncHandler(passwordController.forgotPassword));
// router.post("/reset-password", validate({ body: resetPasswordRequestSchema }), asyncHandler(passwordController.resetPassword));
// router.post("/logout", authenticate, asyncHandler(authController.logout));
// router.post("/refresh", validate({ body: refreshTokenRequestSchema }), asyncHandler(authController.refresh));

export { router as authRoutes };
