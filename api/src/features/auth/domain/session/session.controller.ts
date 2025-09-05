import type { Request, Response } from "express";
import { extractRequestContext } from "../../../../shared/utils/request.util.js";
import type { AuthServices } from "../../shared/factories/auth.factory.js";
import type {
	LoginRequestDto,
	LoginResponseDto,
	LogoutRequestDto,
	LogoutResponseDto,
} from "./session.dto.js";

/**
 * Session Controller
 * Handles HTTP layer concerns for user authentication and session management
 * Delegates business logic to the LoginService and LogoutService
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
		const { ipAddress, userAgent } = extractRequestContext(req);

		// Log login attempt
		req.log?.info(
			{
				email: validated.body.email,
				ipAddress,
			},
			"Login attempt",
		);

		// Call service with combined data (pass res for cookie setting)
		const result = await this.services.loginService.login(
			{
				...validated.body,
				ipAddress,
				userAgent,
			},
			res,
			req.log,
		);

		// Log successful login
		req.log?.info(
			{
				email: validated.body.email,
				userId: result.user.id,
				sessionId: result.session.id,
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

	/**
	 * Handle user logout request
	 * @param req - Express request object (for cookie extraction)
	 * @param res - Express response object (for cookie clearing)
	 */
	async logout(req: Request, res: Response<LogoutResponseDto>): Promise<void> {
		// Extract validated data from res.locals (set by validation middleware)
		const validated = res.locals.validated as { body: LogoutRequestDto };

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent } = extractRequestContext(req);

		// Call service with combined data (pass req/res for cookie handling)
		const result = await this.services.logoutService.logout(
			{
				...(validated.body.everywhere !== undefined && { everywhere: validated.body.everywhere }),
				ipAddress,
				userAgent,
			},
			req,
			res,
			req.log,
		);

		// Return success response
		res.status(200).json({
			success: result.success,
			message: result.message,
			sessionsRevoked: result.sessionsRevoked,
		});
	}
}
