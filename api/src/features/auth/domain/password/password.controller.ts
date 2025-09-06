import type { Request, Response } from "express";
import { extractRequestContext } from "../../../../shared/utils/request.util.js";
import type { AuthServices } from "../../shared/factories/auth.factory.js";
import type {
	ChangePasswordRequestDto,
	ChangePasswordResponseDto,
	ForgotPasswordRequestDto,
	ForgotPasswordResponseDto,
	ResetPasswordRequestDto,
	ResetPasswordResponseDto,
} from "./password.dto.js";

/**
 * Password Controller
 * Handles HTTP layer concerns for password management operations
 * Delegates business logic to the ForgotPasswordService and ResetPasswordService
 */
export class PasswordController {
	constructor(private readonly services: AuthServices) {}

	/**
	 * Handle forgot password request
	 * @param req - Express request object
	 * @param res - Express response object
	 */
	async forgotPassword(req: Request, res: Response<ForgotPasswordResponseDto>): Promise<void> {
		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: ForgotPasswordRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent } = extractRequestContext(req);

		// Log forgot password attempt
		req.log?.info(
			{
				email: validated.body.email,
				ipAddress,
			},
			"Password reset request",
		);

		// Call service with combined data
		const result = await this.services.forgotPasswordService.forgotPassword(
			{
				...validated.body,
				ipAddress,
				userAgent,
			},
			req.log,
		);

		// Log successful password reset request
		req.log?.info(
			{
				email: validated.body.email,
			},
			"Password reset request processed",
		);

		// Return success response
		res.status(200).json({
			success: result.success,
			message: result.message,
			...(result.otpExpiresAt && { otpExpiresAt: result.otpExpiresAt.toISOString() }),
		});
	}

	/**
	 * Handle reset password request
	 * @param req - Express request object
	 * @param res - Express response object
	 */
	async resetPassword(req: Request, res: Response<ResetPasswordResponseDto>): Promise<void> {
		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: ResetPasswordRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent } = extractRequestContext(req);

		// Log reset password attempt
		req.log?.info(
			{
				email: validated.body.email,
				ipAddress,
			},
			"Password reset completion attempt",
		);

		// Call service with combined data
		const result = await this.services.resetPasswordService.resetPassword(
			{
				...validated.body,
				ipAddress,
				userAgent,
			},
			req.log,
		);

		// Log successful password reset
		req.log?.info(
			{
				email: validated.body.email,
			},
			"Password reset completed successfully",
		);

		// Return success response
		res.status(200).json({
			success: result.success,
			message: result.message,
		});
	}

	/**
	 * Handle change password request
	 * @param req - Express request object (with req.auth from authenticate middleware)
	 * @param res - Express response object
	 */
	async changePassword(req: Request, res: Response<ChangePasswordResponseDto>): Promise<void> {
		// Extract authentication context from middleware
		if (!req.auth) {
			throw new Error("Authentication context missing - middleware not properly configured");
		}
		const { userId, sessionId } = req.auth;

		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: ChangePasswordRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent } = extractRequestContext(req);

		// Log change password attempt
		req.log?.info(
			{
				userId,
				sessionId,
				ipAddress,
			},
			"Password change request",
		);

		// Call service with combined data
		const result = await this.services.changePasswordService.changePassword(
			{
				userId,
				sessionId,
				...validated.body,
				ipAddress,
				userAgent,
			},
			req.log,
		);

		// Log successful password change
		req.log?.info(
			{
				userId,
				sessionId,
			},
			"Password change completed successfully",
		);

		// Return success response
		res.status(200).json({
			success: result.success,
			message: result.message,
		});
	}
}
