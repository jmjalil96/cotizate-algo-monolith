import type { Request } from "express";

/**
 * Request utility functions for extracting common metadata
 */

/**
 * Extract request context for security and auditing
 * @param req - Express request object
 * @returns Request context with IP, user agent, and request ID
 */
export function extractRequestContext(req: Request): {
	ipAddress: string;
	userAgent: string;
	requestId: string;
} {
	return {
		ipAddress: req.ip || req.socket.remoteAddress || "unknown",
		userAgent: req.headers["user-agent"] || "unknown",
		requestId: String(req.id || "unknown"),
	};
}
