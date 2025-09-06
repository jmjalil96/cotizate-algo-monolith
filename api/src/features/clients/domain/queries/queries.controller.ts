import type { Request, Response } from "express";
import { extractRequestContext } from "../../../../shared/utils/request.util.js";
import type { ClientServices } from "../../shared/factories/clients.factory.js";
import type { GetClientsQueryDto, GetClientsResponseDto } from "./queries.dto.js";

/**
 * Queries Controller
 * Handles HTTP layer concerns for client query operations
 * Delegates business logic to the GetClientsService
 */
export class QueriesController {
	constructor(private readonly services: ClientServices) {}

	/**
	 * Handle get clients request
	 * @param req - Express request object (with req.userContext from authorization middleware)
	 * @param res - Express response object
	 */
	async getClients(req: Request, res: Response<GetClientsResponseDto>): Promise<void> {
		// Extract authorization context from middleware
		if (!req.userContext) {
			throw new Error("Authorization context missing - middleware not properly configured");
		}
		const { userId, organizationId, scope } = req.userContext;

		// Extract validated query parameters from res.locals (set by validation middleware)
		const validated = res.locals.validated as { query: GetClientsQueryDto };
		const queryParams = validated.query;

		// Extract request metadata for security and auditing
		const { ipAddress, userAgent } = extractRequestContext(req);

		// Log client query attempt
		req.log?.info(
			{
				userId,
				organizationId,
				queryParams: {
					page: queryParams.page,
					limit: queryParams.limit,
					filters: {
						displayName: queryParams.displayName,
						email: queryParams.email,
						clientType: queryParams.clientType,
						isActive: queryParams.isActive,
					},
					sort: {
						sortBy: queryParams.sortBy,
						sortOrder: queryParams.sortOrder,
					},
				},
				scope: scope.filterType,
				ipAddress,
			},
			"Client query request",
		);

		// Build service input with proper type handling
		const serviceInput = {
			// Pagination
			page: queryParams.page,
			limit: queryParams.limit,
			// Search parameters (handle undefined properly)
			displayName: queryParams.displayName,
			email: queryParams.email,
			clientType: queryParams.clientType,
			isActive: queryParams.isActive,
			// Date conversion (ISO strings to Date objects)
			dateFrom: queryParams.dateFrom ? new Date(queryParams.dateFrom) : undefined,
			dateTo: queryParams.dateTo ? new Date(queryParams.dateTo) : undefined,
			// Sort parameters
			sortBy: queryParams.sortBy,
			sortOrder: queryParams.sortOrder,
			// User context from authorization middleware
			organizationId,
			userId,
			scope,
			// Request context
			ipAddress,
			userAgent,
		};

		// Call service with combined data
		const result = await this.services.getClientsService.getClients(serviceInput, req.log);

		// Log successful client query
		req.log?.info(
			{
				userId,
				organizationId,
				resultCount: result.clients.length,
				totalCount: result.pagination.totalCount,
			},
			"Client query completed successfully",
		);

		// Return paginated response (convert Date objects to ISO strings)
		res.status(200).json({
			clients: result.clients.map((client) => ({
				...client,
				// Convert Date objects to ISO strings
				createdAt: client.createdAt.toISOString(),
				updatedAt: client.updatedAt.toISOString(),
				// Handle null values properly for DTO
				firstName: client.firstName ?? undefined,
				lastName: client.lastName ?? undefined,
				companyName: client.companyName ?? undefined,
				phoneWork: client.phoneWork ?? undefined,
			})),
			pagination: result.pagination,
		});
	}
}
