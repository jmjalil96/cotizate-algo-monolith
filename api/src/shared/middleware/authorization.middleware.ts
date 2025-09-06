import type { NextFunction, Request, RequestHandler, Response } from "express";
import { prisma } from "../../db/client.js";
import { findUserById } from "../../features/auth/shared/repositories/user.repository.js";
import {
	flattenUserPermissions,
	hasPermission,
} from "../../features/auth/shared/utils/permission.util.js";
import { AppError, forbidden } from "../errors/AppError.js";
import { extractRequestContext } from "../utils/request.util.js";

/**
 * Authorization Middleware Factory
 * Creates middleware that validates user permissions and sets authorization context.
 * Requires authenticate middleware to run first - depends on req.auth being set.
 *
 * Performance Design:
 * - Single user query per request (loaded once, cached in req.userContext)
 * - Fail fast on permission denial (before any business logic)
 * - Rich scope context for repository filtering decisions
 *
 * Security Design:
 * - Centralized permission enforcement (cannot be bypassed)
 * - Comprehensive audit logging for permission denials
 * - Scope information pre-calculated for consistent filtering
 */

/**
 * Require Permission Middleware Factory
 * @param resource - Resource name (e.g., "clients", "users")
 * @param action - Action name (e.g., "read", "create", "update", "delete")
 * @returns Express middleware that validates permissions and sets authorization context
 */
export const requirePermission = (resource: string, action: string): RequestHandler => {
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex authorization validation logic required for security
	return async (req: Request, _res: Response, next: NextFunction) => {
		const { ipAddress } = extractRequestContext(req);

		try {
			// DEPENDENCY CHECK: Authenticate middleware must have run first
			if (!req.auth) {
				req.log?.error(
					{
						resource,
						action,
						ipAddress,
					},
					"Authorization middleware called without authentication context",
				);
				throw new Error("Authorization middleware requires authentication middleware to run first");
			}

			// LOAD USER WITH COMPLETE PERMISSIONS (heavy query but once per request)
			const user = await findUserById(prisma, req.auth.userId);
			if (!user) {
				req.log?.error(
					{
						userId: req.auth.userId,
						resource,
						action,
						ipAddress,
					},
					"User not found during authorization - data integrity issue",
				);
				throw forbidden("Access denied");
			}

			// VALIDATE PERMISSION using existing utility
			if (!hasPermission(user, resource, action)) {
				req.log?.warn(
					{
						userId: req.auth.userId,
						email: user.email,
						organizationId: req.auth.organizationId,
						requiredPermission: `${resource}:${action}`,
						userPermissions: flattenUserPermissions(user),
						ipAddress,
					},
					"Permission denied - insufficient privileges",
				);
				throw forbidden(`Missing permission: ${resource}:${action}`);
			}

			// DETERMINE SCOPE based on user permissions and role
			const permissions = flattenUserPermissions(user);
			const canAccessAll = hasPermission(user, resource, "*") || hasPermission(user, "*", "*");

			// Set scope context for repository filtering
			const scope = {
				canAccessAll,
				filterType: canAccessAll
					? "organization"
					: ("own" as "own" | "department" | "organization"),
				// Future: Add department-level scope when needed
				// departmentId: user.departmentId,
				// roleLevel: user.roles[0]?.role?.name,
			};

			// SET RICH AUTHORIZATION CONTEXT for repositories
			req.userContext = {
				userId: req.auth.userId,
				sessionId: req.auth.sessionId,
				organizationId: req.auth.organizationId,
				permissions,
				user,
				scope,
			};

			req.log?.debug(
				{
					userId: req.auth.userId,
					resource,
					action,
					canAccessAll: scope.canAccessAll,
					filterType: scope.filterType,
					ipAddress,
				},
				"Authorization successful",
			);

			next();
		} catch (error) {
			// Log only unexpected, server-side errors (permission denials are expected)
			const isClientError = error instanceof AppError && error.statusCode < 500;
			if (!isClientError) {
				req.log?.error(
					{
						userId: req.auth?.userId,
						resource,
						action,
						ipAddress,
						error: error instanceof Error ? error.message : String(error),
					},
					"Internal error during authorization",
				);
			}

			next(error);
		}
	};
};
