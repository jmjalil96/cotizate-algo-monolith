import { z } from "zod";

/**
 * Client schemas recreated from backend API
 * Based on: api/src/features/clients/domain/queries/queries.dto.ts
 */

// ============================================
// REQUEST SCHEMA (Query Parameters)
// ============================================

/**
 * GET /clients query parameters validation
 */
export const getClientsQuerySchema = z.object({
	// Pagination parameters
	page: z.coerce.number().min(1, "La página debe ser al menos 1").default(1),
	limit: z.coerce
		.number()
		.min(1, "El límite debe ser al menos 1")
		.max(100, "El límite no puede exceder 100")
		.default(20),

	// Search parameters
	displayName: z.string().min(1, "La búsqueda por nombre no puede estar vacía").optional(),
	email: z.string().email("Formato de email inválido").optional(),

	// Filter parameters
	clientType: z.enum(["INDIVIDUAL", "COMPANY"]).optional(),
	isActive: z.coerce.boolean().optional(),

	// Date range filtering
	dateFrom: z.string().datetime("Formato de fecha inválido").optional(),
	dateTo: z.string().datetime("Formato de fecha inválido").optional(),

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
// ENUMS (matching Prisma schema)
// ============================================

export const ClientType = {
	INDIVIDUAL: "INDIVIDUAL",
	COMPANY: "COMPANY",
} as const;

export const IdType = {
	RUC: "RUC",
	CEDULA: "CEDULA",
	PASAPORTE: "PASAPORTE",
} as const;

export const Sex = {
	MASCULINO: "MASCULINO",
	FEMENINO: "FEMENINO",
	OTRO: "OTRO",
} as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type GetClientsQuery = z.infer<typeof getClientsQuerySchema>;
export type GetClientsResponse = z.infer<typeof getClientsResponseSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

export type ClientTypeValue = keyof typeof ClientType;
export type IdTypeValue = keyof typeof IdType;
export type SexValue = keyof typeof Sex;
