import type { PrismaClient } from "@prisma/client";
import type { Logger } from "../../../../config/logger.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import {
	type ClientFilters,
	type ClientSort,
	countClientsForUser,
	findClientsForUser,
} from "../../shared/repositories/client.repository.js";
import type { GetClientsInput, GetClientsResult } from "../../shared/types/clients.types.js";
import { invalidDateRange } from "./queries.errors.js";

/**
 * Get Clients Service
 * Handles client data retrieval with scope-based filtering, pagination, and search.
 * Extremely lightweight service that leverages pre-validated authorization context.
 *
 * Core Responsibility: Efficient client data retrieval with proper access control
 *
 * Key Design Principles:
 * - Trust middleware validation (no duplicate auth/permission checks)
 * - Apply organization boundary (multi-tenant security)
 * - Apply user scope filtering (own vs department vs all within org)
 * - Pagination by default (never load all records)
 * - Database-level filtering (efficient queries)
 * - Structured response with metadata
 */
export class GetClientsService {
	constructor(private readonly prisma: PrismaClient) {}

	/**
	 * Main get clients method - efficient paginated client retrieval with scope filtering
	 * @param getClientsData - Pagination, search, and user context from authorization
	 * @param logger - Request-scoped logger for tracing
	 * @returns Paginated clients result with scope-appropriate filtering
	 *
	 * SERVICE LOGIC FLOW:
	 * 1. Extract pagination parameters (page, limit, offset calculation)
	 * 2. Extract search/filter parameters (displayName, email, clientType, etc.)
	 * 3. Extract sort parameters (field, direction)
	 * 4. Build base query with organization filtering (multi-tenant boundary)
	 * 5. Apply scope filtering based on user context (own vs all within org)
	 * 6. Apply search filters (displayName contains, email contains, type equals)
	 * 7. Execute paginated query with total count (parallel queries for efficiency)
	 * 8. Return structured result with clients + pagination metadata
	 *
	 * SCOPE FILTERING LOGIC (Based on req.userContext.scope):
	 * - canAccessAll = true → All organization clients
	 * - filterType = "own" → Only clients created by this user (createdById = userId)
	 * - filterType = "department" → Future: Department-level filtering
	 * - filterType = "organization" → All organization clients (same as canAccessAll)
	 *
	 * ORGANIZATION FILTERING (Critical Security):
	 * - ALWAYS filter by organizationId (tenant isolation)
	 * - This is the primary security boundary for multi-tenant data
	 * - Even admin users are limited to their organization's data
	 *
	 * PAGINATION STRATEGY (Performance):
	 * - Default page size: 20 items (configurable)
	 * - Maximum page size: 100 items (prevent abuse)
	 * - Offset-based pagination (simple, predictable)
	 * - Total count query (parallel execution for efficiency)
	 * - Include pagination metadata in response
	 *
	 * SEARCH/FILTERING SUPPORT:
	 * - Client displayName (contains search)
	 * - Client email (contains search)
	 * - Client type (INDIVIDUAL/COMPANY)
	 * - Active status (boolean)
	 * - Date range filtering (createdAt between)
	 * - All filters applied at database level for efficiency
	 *
	 * SORTING SUPPORT:
	 * - Default sort: createdAt DESC (most recent first)
	 * - Supported fields: displayName, email, createdAt, updatedAt
	 * - Supported directions: ASC, DESC
	 * - Validate sort parameters to prevent injection
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex filtering and pagination logic required for comprehensive client queries
	async getClients(getClientsData: GetClientsInput, logger?: Logger): Promise<GetClientsResult> {
		const {
			page,
			limit,
			displayName,
			email,
			clientType,
			isActive,
			dateFrom,
			dateTo,
			sortBy,
			sortOrder,
			organizationId,
			userId,
			scope,
			ipAddress,
		} = getClientsData;

		try {
			// Validate business rules
			if (dateFrom && dateTo && dateFrom > dateTo) {
				logger?.warn(
					{
						userId,
						organizationId,
						dateFrom,
						dateTo,
						ipAddress,
					},
					"Invalid date range in client query",
				);
				throw invalidDateRange();
			}

			// Calculate pagination offset
			const offset = (page - 1) * limit;

			// Build filters object for repository
			const filters: ClientFilters = {
				organizationId,
				// Apply scope filtering based on authorization context
				...(scope.filterType === "own" && { createdById: userId }),
				// Apply search filters
				...(displayName && { displayName }),
				...(email && { email }),
				...(clientType && { clientType }),
				...(isActive !== undefined && { isActive }),
				...(dateFrom && { dateFrom }),
				...(dateTo && { dateTo }),
			};

			// Build sort object
			const sort: ClientSort = {
				field: sortBy,
				direction: sortOrder,
			};

			// Execute parallel queries for efficiency
			const [clients, totalCount] = await Promise.all([
				findClientsForUser(this.prisma, filters, sort, { offset, limit }),
				countClientsForUser(this.prisma, filters),
			]);

			// Calculate pagination metadata
			const totalPages = Math.ceil(totalCount / limit);
			const hasNextPage = page < totalPages;
			const hasPrevPage = page > 1;

			const pagination = {
				page,
				limit,
				totalCount,
				totalPages,
				hasNextPage,
				hasPrevPage,
			};

			// Log successful query execution
			logger?.info(
				{
					userId,
					organizationId,
					resultCount: clients.length,
					totalCount,
					page,
					limit,
					appliedFilters: {
						scope: scope.filterType,
						hasSearch: !!(displayName || email),
						hasClientTypeFilter: !!clientType,
						hasActiveFilter: isActive !== undefined,
						hasDateRange: !!(dateFrom || dateTo),
					},
					ipAddress,
				},
				"Clients query executed successfully",
			);

			return {
				clients,
				pagination,
			};
		} catch (error) {
			// Log internal errors (but not expected business errors)
			if (!(error instanceof AppError)) {
				logger?.error(
					{
						userId,
						organizationId,
						queryParams: {
							page,
							limit,
							displayName,
							email,
							clientType,
							isActive,
							sortBy,
							sortOrder,
						},
						ipAddress,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during clients query",
				);
			}

			// Re-throw the error for controller to handle
			throw error;
		}
	}
}
