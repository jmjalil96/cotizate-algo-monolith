import type { Request, Response } from "express";
import { logger } from "../../../../config/logger.js";
import { extractRequestContext } from "../../../../shared/utils/request.util.js";
import type { AuthServices } from "../../shared/factories/auth.factory.js";
import type {
	RegisterRequestDto,
	RegisterResponseDto,
	ResendCodeRequestDto,
	ResendCodeResponseDto,
	VerifyEmailRequestDto,
	VerifyEmailResponseDto,
} from "./registration.dto.js";

/**
 * Registration Controller
 * Handles HTTP layer concerns for user registration, email verification, and OTP resending
 * Delegates business logic to the RegisterService, EmailVerificationService, and ResendService
 */
export class RegistrationController {
	constructor(private readonly services: AuthServices) {}

	/**
	 * Handle user registration request
	 * @param req - Express request object
	 * @param res - Express response object
	 */
	async register(req: Request, res: Response<RegisterResponseDto>): Promise<void> {
		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: RegisterRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent, requestId } = extractRequestContext(req);

		// Log registration attempt
		logger.info(
			{
				email: validated.body.email,
				organizationName: validated.body.organizationName,
				ipAddress,
				requestId,
			},
			"Registration attempt",
		);

		// Call service with combined data
		const result = await this.services.registerService.register({
			...validated.body,
			ipAddress,
			userAgent,
			requestId,
		});

		// Log successful registration
		logger.info(
			{
				email: validated.body.email,
				requestId,
			},
			"Registration successful - OTP sent",
		);

		// Return success response with session token
		res.status(201).json({
			sessionToken: result.sessionToken,
			otpExpiresAt: result.otpExpiresAt.toISOString(),
		});
	}

	/**
	 * Handle email verification request
	 * @param req - Express request object
	 * @param res - Express response object
	 */
	async verifyEmail(req: Request, res: Response<VerifyEmailResponseDto>): Promise<void> {
		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: VerifyEmailRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent, requestId } = extractRequestContext(req);

		// Log verification attempt
		logger.info(
			{
				email: validated.body.email,
				ipAddress,
				requestId,
			},
			"Email verification attempt",
		);

		// Call service with combined data
		const result = await this.services.emailVerificationService.verifyEmail({
			...validated.body,
			ipAddress,
			userAgent,
			requestId,
		});

		// Log successful verification
		logger.info(
			{
				email: validated.body.email,
				requestId,
			},
			"Email verification successful",
		);

		// Return success response
		res.status(200).json({
			success: result.success,
			message: result.message,
		});
	}

	/**
	 * Handle OTP resend request
	 * @param req - Express request object
	 * @param res - Express response object
	 */
	async resendCode(req: Request, res: Response<ResendCodeResponseDto>): Promise<void> {
		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: ResendCodeRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent, requestId } = extractRequestContext(req);

		// Log resend attempt
		logger.info(
			{
				email: validated.body.email,
				ipAddress,
				requestId,
			},
			"OTP resend attempt",
		);

		// Call service with combined data
		const result = await this.services.resendService.resendCode({
			...validated.body,
			ipAddress,
			userAgent,
			requestId,
		});

		// Log successful resend
		logger.info(
			{
				email: validated.body.email,
				requestId,
			},
			"OTP resend successful",
		);

		// Return success response with optional fields
		res.status(200).json({
			success: result.success,
			message: result.message,
			...(result.otpExpiresAt && { otpExpiresAt: result.otpExpiresAt.toISOString() }),
			...(result.waitSeconds !== undefined && { waitSeconds: result.waitSeconds }),
			...(result.retryAfter && { retryAfter: result.retryAfter.toISOString() }),
		});
	}
}
