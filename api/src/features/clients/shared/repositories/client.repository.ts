import type { Client, Prisma, PrismaClient } from "@prisma/client";

/**
 * Client repository helper functions
 * Data access layer for client-related queries with scope-aware filtering
 */

/**
 * Filter parameters for client queries
 */
export interface ClientFilters {
	// Organization boundary (always applied)
	organizationId: string;

	// Scope filtering
	createdById?: string | undefined; // For "own" scope filtering

	// Search filters
	displayName?: string | undefined; // Contains search
	email?: string | undefined; // Contains search
	clientType?: "INDIVIDUAL" | "COMPANY" | undefined; // Exact match
	isActive?: boolean | undefined; // Boolean filter

	// Date range filters
	dateFrom?: Date | undefined;
	dateTo?: Date | undefined;
}

/**
 * Sorting parameters for client queries
 */
export interface ClientSort {
	field: "displayName" | "email" | "createdAt" | "updatedAt";
	direction: "asc" | "desc";
}

/**
 * Find clients with scope-aware filtering and pagination
 * @param prisma - Prisma client instance
 * @param filters - Filter parameters including organization and scope filtering
 * @param sort - Sort field and direction
 * @param pagination - Page offset and limit
 * @returns Array of clients matching filters and scope
 */
export async function findClientsForUser(
	prisma: PrismaClient | Prisma.TransactionClient,
	filters: ClientFilters,
	sort: ClientSort,
	pagination: { offset: number; limit: number },
): Promise<Client[]> {
	// Build WHERE conditions progressively
	const whereConditions: Prisma.ClientWhereInput = {
		// Organization boundary (multi-tenant security)
		organizationId: filters.organizationId,
	};

	// Apply scope filtering (own vs all within organization)
	if (filters.createdById) {
		whereConditions.createdById = filters.createdById;
	}

	// Apply search filters
	if (filters.displayName) {
		whereConditions.displayName = {
			contains: filters.displayName,
			mode: "insensitive",
		};
	}

	if (filters.email) {
		whereConditions.email = {
			contains: filters.email,
			mode: "insensitive",
		};
	}

	// Apply client type filter
	if (filters.clientType) {
		whereConditions.clientType = filters.clientType;
	}

	// Apply active status filter
	if (filters.isActive !== undefined) {
		whereConditions.isActive = filters.isActive;
	}

	// Apply date range filter
	if (filters.dateFrom || filters.dateTo) {
		whereConditions.createdAt = {};
		if (filters.dateFrom) {
			whereConditions.createdAt.gte = filters.dateFrom;
		}
		if (filters.dateTo) {
			whereConditions.createdAt.lte = filters.dateTo;
		}
	}

	return prisma.client.findMany({
		where: whereConditions,
		orderBy: {
			[sort.field]: sort.direction,
		},
		skip: pagination.offset,
		take: pagination.limit,
	});
}

/**
 * Count clients matching filters for pagination metadata
 * @param prisma - Prisma client instance
 * @param filters - Filter parameters (same as findClientsForUser but without pagination)
 * @returns Total count of clients matching filters
 */
export async function countClientsForUser(
	prisma: PrismaClient | Prisma.TransactionClient,
	filters: ClientFilters,
): Promise<number> {
	// Build WHERE conditions (same logic as findClientsForUser)
	const whereConditions: Prisma.ClientWhereInput = {
		// Organization boundary (multi-tenant security)
		organizationId: filters.organizationId,
	};

	// Apply scope filtering (own vs all within organization)
	if (filters.createdById) {
		whereConditions.createdById = filters.createdById;
	}

	// Apply search filters
	if (filters.displayName) {
		whereConditions.displayName = {
			contains: filters.displayName,
			mode: "insensitive",
		};
	}

	if (filters.email) {
		whereConditions.email = {
			contains: filters.email,
			mode: "insensitive",
		};
	}

	// Apply client type filter
	if (filters.clientType) {
		whereConditions.clientType = filters.clientType;
	}

	// Apply active status filter
	if (filters.isActive !== undefined) {
		whereConditions.isActive = filters.isActive;
	}

	// Apply date range filter
	if (filters.dateFrom || filters.dateTo) {
		whereConditions.createdAt = {};
		if (filters.dateFrom) {
			whereConditions.createdAt.gte = filters.dateFrom;
		}
		if (filters.dateTo) {
			whereConditions.createdAt.lte = filters.dateTo;
		}
	}

	return prisma.client.count({
		where: whereConditions,
	});
}
