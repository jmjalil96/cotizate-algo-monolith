import type { Request, Response } from "express";
import { logger } from "../../../../config/logger.js";
import { extractRequestContext } from "../../../../shared/utils/request.util.js";
import type { AuthServices } from "../../shared/factories/auth.factory.js";
import type { LoginRequestDto, LoginResponseDto } from "./session.dto.js";

/**
 * Session Controller
 * Handles HTTP layer concerns for user authentication and session management
 * Delegates business logic to the LoginService
 */
export class SessionController {
	constructor(private readonly services: AuthServices) {}

	/**
	 * Handle user login request
	 * @param req - Express request object
	 * @param res - Express response object
	 */
	async login(req: Request, res: Response<LoginResponseDto>): Promise<void> {
		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: LoginRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent, requestId } = extractRequestContext(req);

		// Log login attempt
		logger.info(
			{
				email: validated.body.email,
				ipAddress,
				requestId,
			},
			"Login attempt",
		);

		// Call service with combined data (pass res for cookie setting)
		const result = await this.services.loginService.login(
			{
				...validated.body,
				ipAddress,
				userAgent,
				requestId,
			},
			res,
		);

		// Log successful login
		logger.info(
			{
				email: validated.body.email,
				userId: result.user.id,
				sessionId: result.session.id,
				requestId,
			},
			"Login successful",
		);

		// Return success response with user and session data
		res.status(200).json({
			success: result.success,
			message: result.message,
			user: {
				...result.user,
				organization: result.user.organization,
				permissions: result.user.permissions,
			},
			session: {
				id: result.session.id,
				expiresAt: result.session.expiresAt.toISOString(),
				lastActivity: result.session.lastActivity.toISOString(),
				tokenLastFour: result.session.tokenLastFour,
			},
		});
	}
}
