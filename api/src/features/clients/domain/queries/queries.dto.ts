import { z } from "zod";

/**
 * Clients Queries DTO - Request/Response schemas for client data retrieval endpoints
 */

// ============================================
// REQUEST SCHEMA (Query Parameters)
// ============================================

/**
 * GET /clients query parameters validation
 */
export const getClientsQuerySchema = z.object({
	// Pagination parameters
	page: z.coerce.number().min(1, "Page must be at least 1").default(1),
	limit: z.coerce
		.number()
		.min(1, "Limit must be at least 1")
		.max(100, "Limit cannot exceed 100")
		.default(20),

	// Search parameters
	displayName: z.string().min(1, "Display name search must not be empty").optional(),
	email: z.string().email("Invalid email format").optional(),

	// Filter parameters
	clientType: z.enum(["INDIVIDUAL", "COMPANY"]).optional(),
	isActive: z.coerce.boolean().optional(),

	// Date range filtering
	dateFrom: z.string().datetime("Invalid date format").optional(),
	dateTo: z.string().datetime("Invalid date format").optional(),

	// Sorting parameters
	sortBy: z.enum(["displayName", "email", "createdAt", "updatedAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================
// RESPONSE SCHEMA
// ============================================

/**
 * Client object schema (for response array)
 */
export const clientSchema = z.object({
	id: z.string().uuid(),
	displayName: z.string(),
	email: z.string().email(),
	clientType: z.enum(["INDIVIDUAL", "COMPANY"]),
	isActive: z.boolean(),
	organizationId: z.string().uuid(),
	createdById: z.string().uuid(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	// Optional fields (nullable in schema)
	firstName: z.string().nullable().optional(),
	lastName: z.string().nullable().optional(),
	companyName: z.string().nullable().optional(),
	phoneMobile: z.string(),
	phoneWork: z.string().nullable().optional(),
});

/**
 * Pagination metadata schema
 */
export const paginationSchema = z.object({
	page: z.number().int().min(1),
	limit: z.number().int().min(1),
	totalCount: z.number().int().min(0),
	totalPages: z.number().int().min(0),
	hasNextPage: z.boolean(),
	hasPrevPage: z.boolean(),
});

/**
 * GET /clients response body (200 OK)
 */
export const getClientsResponseSchema = z.object({
	clients: z.array(clientSchema),
	pagination: paginationSchema,
});

// ============================================
// TYPE EXPORTS
// ============================================

export type GetClientsQueryDto = z.infer<typeof getClientsQuerySchema>;
export type GetClientsResponseDto = z.infer<typeof getClientsResponseSchema>;
export type ClientDto = z.infer<typeof clientSchema>;
export type PaginationDto = z.infer<typeof paginationSchema>;
