import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { NextFunction, Request, Response } from "express";
import type { LevelWithSilent } from "pino";
import type { Options } from "pino-http";
import { pinoHttp } from "pino-http";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

// Skip logging for these paths
const skipPaths = [
	"/health",
	"/metrics",
	"/favicon.ico",
	"/api/v1/health", // Skip API health checks
	"/api/v1/metrics", // Skip API metrics
];

// Custom log level based on status code
const customLogLevel = (
	_req: IncomingMessage,
	res: ServerResponse,
	err?: Error,
): LevelWithSilent => {
	if (err || res.statusCode >= 500) return "error";
	if (res.statusCode >= 400) return "warn";
	if (res.statusCode >= 300) return "info";
	return "info";
};

// Custom success message based on request
const customSuccessMessage = (
	req: IncomingMessage & {
		method?: string | undefined;
		url?: string | undefined;
	},
	res: ServerResponse & { statusCode: number },
	responseTime: number,
): string => {
	const method = req.method || "UNKNOWN";
	const url = req.url || "/";
	const statusCode = res.statusCode;

	return `${method} ${url} ${statusCode} - ${Math.round(responseTime)}ms`;
};

// Custom error message
const customErrorMessage = (
	req: IncomingMessage & { method?: string | undefined; url?: string | undefined },
	res: ServerResponse & { statusCode: number },
	err: Error,
): string => {
	const method = req.method || "UNKNOWN";
	const url = req.url || "/";
	const statusCode = res.statusCode;

	return `${method} ${url} ${statusCode} - ${err.message}`;
};

// Pino HTTP options
const options: Options = {
	logger,
	// Generate or use existing request ID
	genReqId: (req) => {
		const existingId = req.headers["x-request-id"] as string;
		return existingId || randomUUID();
	},
	// Custom log level
	customLogLevel,
	// Custom success message
	customSuccessMessage,
	// Custom error message
	customErrorMessage,
	// Skip logging for certain paths
	autoLogging: {
		ignore: (req) => {
			const path = req.url;
			return skipPaths.some((skip) => path?.startsWith(skip));
		},
	},
	// Custom request serializer
	serializers: {
		req: (req) => ({
			id: req.id,
			method: req.method,
			url: req.url,
			query: req.query,
			params: req.params,
			headers: {
				"user-agent": req.headers["user-agent"],
				"content-type": req.headers["content-type"],
				"x-request-id": req.headers["x-request-id"],
			},
		}),
		res: (res) => ({
			statusCode: res.statusCode,
		}),
	},
	// Additional custom properties to log
	customProps: (_req, _res) => ({
		environment: env.NODE_ENV,
	}),
	// Set request start time
	customAttributeKeys: {
		req: "request",
		res: "response",
		err: "error",
		reqId: "requestId",
		responseTime: "duration",
	},
};

// Create middleware
export const requestLogger = pinoHttp(options);

// Kept for compatibility but can be removed if not needed
export const addRequestStartTime = (_req: Request, _res: Response, next: NextFunction) => {
	next();
};
