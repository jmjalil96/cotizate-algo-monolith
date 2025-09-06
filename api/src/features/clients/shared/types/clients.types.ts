/**
 * Clients Types - Internal types for client management service logic
 */

// ============================================
// SERVICE INPUT/OUTPUT TYPES
// ============================================

/**
 * Client data structure (service layer with Date objects)
 * Matches Prisma Client model structure
 */
export interface Client {
	id: string;
	displayName: string;
	email: string;
	clientType: "INDIVIDUAL" | "COMPANY";
	isActive: boolean;
	organizationId: string;
	createdById: string;
	createdAt: Date; // Date object (not string like DTO)
	updatedAt: Date; // Date object (not string like DTO)
	// Additional common fields for display (nullable in schema)
	firstName?: string | null;
	lastName?: string | null;
	companyName?: string | null;
	phoneMobile: string;
	phoneWork?: string | null;
}

/**
 * Pagination metadata (service layer)
 */
export interface Pagination {
	page: number;
	limit: number;
	totalCount: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

/**
 * What the get clients service receives from the controller (after query validation)
 */
export interface GetClientsInput {
	// Query parameters (from validated query)
	page: number; // Already coerced from DTO
	limit: number; // Already coerced from DTO
	displayName?: string | undefined; // Optional search filter
	email?: string | undefined; // Optional search filter
	clientType?: "INDIVIDUAL" | "COMPANY" | undefined; // Optional client type filter
	isActive?: boolean | undefined; // Optional active status filter
	dateFrom?: Date | undefined; // Converted from ISO string
	dateTo?: Date | undefined; // Converted from ISO string
	sortBy: "displayName" | "email" | "createdAt" | "updatedAt"; // Already validated from DTO
	sortOrder: "asc" | "desc"; // Already validated from DTO

	// User context (from authorization middleware)
	organizationId: string; // From req.userContext.organizationId
	userId: string; // From req.userContext.userId
	scope: {
		canAccessAll: boolean;
		filterType: "own" | "department" | "organization";
		departmentId?: string;
		roleLevel?: string;
	};

	// Request context (from middleware)
	ipAddress: string;
	userAgent: string;
}

/**
 * What the get clients service returns to the controller
 */
export interface GetClientsResult {
	clients: Client[];
	pagination: Pagination;
}
