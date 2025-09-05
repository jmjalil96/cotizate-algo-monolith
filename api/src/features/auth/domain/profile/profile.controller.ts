import type { Request, Response } from "express";
import { extractRequestContext } from "../../../../shared/utils/request.util.js";
import type { AuthServices } from "../../shared/factories/auth.factory.js";
import type { MeResponseDto } from "./profile.dto.js";

/**
 * Profile Controller
 * Handles HTTP layer concerns for user profile data retrieval
 * Delegates business logic to the MeService
 */
export class ProfileController {
	constructor(private readonly services: AuthServices) {}

	/**
	 * Handle /me request - get current user profile data
	 * @param req - Express request object (with req.auth from authenticate middleware)
	 * @param res - Express response object
	 */
	async getMe(req: Request, res: Response<MeResponseDto>): Promise<void> {
		// Extract authentication context from middleware
		if (!req.auth) {
			throw new Error("Authentication context missing - middleware not properly configured");
		}
		const { userId, sessionId } = req.auth;

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent } = extractRequestContext(req);

		// Log profile request attempt
		req.log?.info(
			{
				userId,
				sessionId,
				ipAddress,
			},
			"Profile data request",
		);

		// Call service with combined data
		const result = await this.services.meService.getMe(
			{
				userId,
				sessionId,
				ipAddress,
				userAgent,
			},
			req.log,
		);

		// Log successful profile retrieval
		req.log?.info(
			{
				userId,
				sessionId,
			},
			"Profile data retrieved successfully",
		);

		// Return profile data (user + session objects)
		res.status(200).json({
			user: {
				...result.user,
				// Convert Date objects to ISO strings for HTTP response
			},
			session: {
				...result.session,
				expiresAt: result.session.expiresAt.toISOString(),
				lastActivity: result.session.lastActivity.toISOString(),
			},
		});
	}
}
