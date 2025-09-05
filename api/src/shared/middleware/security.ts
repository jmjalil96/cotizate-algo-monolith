import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { RequestHandler } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "../../config/env.js";

// Parse CORS origins
const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
const hasWildcard = corsOrigins.includes("*");

// CORS configuration
const corsOptions = {
	origin: env.NODE_ENV === "production" ? (hasWildcard ? true : corsOrigins) : true, // Allow all in dev
	credentials: !hasWildcard, // Disable credentials if wildcard
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
	exposedHeaders: ["X-Request-Id"],
	maxAge: 86400, // 24 hours
};

// Rate limiting (production only)
const rateLimiter: RequestHandler =
	env.NODE_ENV === "production"
		? rateLimit({
				windowMs: env.RATE_LIMIT_WINDOW_MS,
				max: env.RATE_LIMIT_MAX,
				message: { error: "Too many requests" },
				standardHeaders: true, // Return rate limit info in headers
				legacyHeaders: false,
				keyGenerator: (req) => req.ip || "unknown",
				skip: (req) => req.method === "OPTIONS" || req.path === "/health",
			})
		: (_req, _res, next) => next(); // No rate limit in dev

// Helmet configuration
const helmetConfig = helmet({
	contentSecurityPolicy: false, // Not needed for API
	crossOriginEmbedderPolicy: false, // For API usage
});

// JSON body parser with size limit
const jsonParser = express.json({
	limit: env.MAX_JSON_SIZE,
	strict: true,
});

// URL encoded parser with same limit
const urlEncodedParser = express.urlencoded({
	extended: true,
	limit: env.MAX_JSON_SIZE,
});

// Compression configuration
const compressionConfig = compression({
	// Only compress in production if enabled
	filter:
		env.NODE_ENV === "production" && env.COMPRESSION_ENABLED
			? (req, res) => {
					// Skip compression for SSE or WebSocket
					if (req.headers.accept === "text/event-stream") return false;
					// Use default filter
					return compression.filter(req, res);
				}
			: () => false, // No compression in dev
	threshold: env.COMPRESSION_THRESHOLD || "1kb",
	level: 6, // Balanced compression level
});

// Cookie parser configuration
const cookieParserConfig = cookieParser(); // No secret needed - we hash our own tokens

// Export individual middleware for flexibility
export const security = {
	compression: compressionConfig,
	cors: cors(corsOptions),
	helmet: helmetConfig,
	cookieParser: cookieParserConfig,
	rateLimit: rateLimiter,
	jsonParser,
	urlEncodedParser,
};

// Export combined middleware for convenience
export const applySecurity = [
	security.compression, // Compress response first
	security.helmet,
	security.cors,
	security.cookieParser, // Parse cookies before rate limiting
	security.rateLimit,
	security.jsonParser,
	security.urlEncodedParser,
];
