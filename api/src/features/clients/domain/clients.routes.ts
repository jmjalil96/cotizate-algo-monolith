import { Router } from "express";
import { prisma } from "../../../db/client.js";
import { authenticate } from "../../../shared/middleware/auth.middleware.js";
import { requirePermission } from "../../../shared/middleware/authorization.middleware.js";
import { validate } from "../../../shared/middleware/validator.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { createClientServices } from "../shared/factories/clients.factory.js";
import { QueriesController } from "./queries/queries.controller.js";
import { getClientsQuerySchema } from "./queries/queries.dto.js";

/**
 * Client Routes
 * Defines all client-related endpoints
 */
const router = Router();

// Initialize services and controllers using factory pattern
const clientServices = createClientServices(prisma);
const queriesController = new QueriesController(clientServices);

/**
 * GET /api/v1/clients
 * Retrieve clients with scope-based filtering, pagination, and search
 *
 * Requires: Valid session token + clients:read permission
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - displayName: string (optional, contains search)
 * - email: string (optional, contains search)
 * - clientType: "INDIVIDUAL" | "COMPANY" (optional)
 * - isActive: boolean (optional)
 * - dateFrom: string (optional, ISO datetime)
 * - dateTo: string (optional, ISO datetime)
 * - sortBy: "displayName" | "email" | "createdAt" | "updatedAt" (default: "createdAt")
 * - sortOrder: "asc" | "desc" (default: "desc")
 *
 * Response 200:
 * - clients: array of client objects
 * - pagination: object (page, limit, totalCount, totalPages, hasNext, hasPrev)
 *
 * Error responses:
 * - 400: Invalid query parameters or date range
 * - 401: Authentication required (no valid session)
 * - 403: Permission denied (missing clients:read permission)
 * - 500: Internal server error
 *
 * Scope filtering:
 * - Users with clients:read:* permission see all organization clients
 * - Users with clients:read permission see only their own created clients
 */
router.get(
	"/",
	authenticate,
	requirePermission("clients", "read"),
	validate({ query: getClientsQuerySchema }),
	asyncHandler(async (req, res) => {
		await queriesController.getClients(req, res);
	}),
);

// Future endpoints can be added here:
// router.post("/", authenticate, requirePermission("clients", "create"), validate({ body: createClientRequestSchema }), asyncHandler(createController.createClient));
// router.get("/:id", authenticate, requirePermission("clients", "read"), validate({ params: clientParamsSchema }), asyncHandler(queriesController.getClient));
// router.put("/:id", authenticate, requirePermission("clients", "update"), validate({ params: clientParamsSchema, body: updateClientRequestSchema }), asyncHandler(updateController.updateClient));
// router.delete("/:id", authenticate, requirePermission("clients", "delete"), validate({ params: clientParamsSchema }), asyncHandler(deleteController.deleteClient));

export { router as clientRoutes };
