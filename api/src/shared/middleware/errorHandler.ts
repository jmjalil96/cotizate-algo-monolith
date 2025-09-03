import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	// Guard against headers already sent
	if (res.headersSent) {
		return next(err);
	}

	const isDev = env.NODE_ENV === "development";
	const requestId = String(req.id || "unknown");

	// Always set request ID header for correlation
	res.setHeader("X-Request-Id", requestId);

	// Log error with request context (if logger is available)
	if (req.log) {
		const errorData = {
			err: {
				message: err.message,
				stack: err.stack,
				name: err.name,
				...(err instanceof AppError && { statusCode: err.statusCode }),
				...(err instanceof ZodError && { issueCount: err.issues.length }),
			},
			requestId,
			method: req.method,
			path: req.path,
		};

		// Use appropriate log level based on error type
		if (err instanceof ZodError) {
			req.log.warn(errorData, "Validation failed");
		} else {
			req.log.error(errorData, "Request error");
		}
	}

	// Handle Zod validation errors
	if (err instanceof ZodError) {
		return res.status(400).json({
			error: "Validation failed",
			requestId,
			details: isDev ? err.issues : undefined,
		});
	}

	// Handle AppError
	if (err instanceof AppError) {
		// Check if this is a validation error with issues attached
		const validationError = err as AppError & { issues?: unknown };
		return res.status(err.statusCode).json({
			error: err.message,
			requestId,
			// Include validation details in dev mode if present
			details: isDev && validationError.issues ? validationError.issues : undefined,
		});
	}

	// Handle Express body parser errors
	if (err.type === "entity.too.large") {
		return res.status(413).json({
			error: "Request entity too large",
			requestId,
		});
	}

	if (err.type === "entity.parse.failed") {
		return res.status(400).json({
			error: "Invalid JSON",
			requestId,
		});
	}

	// Handle unknown errors
	const statusCode = err.statusCode || 500;

	return res.status(statusCode).json({
		error: isDev ? err.message : "Internal server error",
		requestId,
		stack: isDev ? err.stack : undefined,
	});
};
