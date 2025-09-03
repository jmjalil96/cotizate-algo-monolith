import type { IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "pino";
import pino from "pino";
import { env } from "./env.js";

// Define sensitive field paths to redact
const redactPaths = [
	"password",
	"token",
	"secret",
	"authorization",
	"cookie",
	"*.password",
	"*.token",
	"*.secret",
	"req.headers.authorization",
	"req.headers.cookie",
	"res.headers['set-cookie']",
];

// Development transport configuration
const devTransport = {
	target: "pino-pretty",
	options: {
		colorize: true,
		translateTime: "HH:MM:ss.l",
		ignore: "pid,hostname",
		messageFormat: "{msg}",
		errorLikeObjectKeys: ["err", "error"],
	},
};

// Production configuration
const prodConfig = {
	level: env.LOG_LEVEL,
	timestamp: pino.stdTimeFunctions.isoTime,
	redact: {
		paths: redactPaths,
		remove: true,
	},
	serializers: {
		err: pino.stdSerializers.err,
		error: pino.stdSerializers.err,
		req: (
			req: IncomingMessage & {
				id?: string;
				method?: string;
				url?: string;
				query?: unknown;
				params?: unknown;
				headers: Record<string, string | string[] | undefined>;
			},
		) => ({
			id: req.id,
			method: req.method,
			url: req.url,
			query: req.query,
			params: req.params,
			headers: {
				"user-agent": req.headers["user-agent"],
				"content-type": req.headers["content-type"],
			},
		}),
		res: (
			res: ServerResponse & {
				statusCode: number;
				headers?: Record<string, string | string[] | undefined>;
			},
		) => ({
			statusCode: res.statusCode,
			headers: res.headers,
		}),
	},
};

// Development configuration
const devConfig = {
	level: "debug", // Show all logs in development
	transport: devTransport,
	serializers: {
		err: pino.stdSerializers.err,
		error: pino.stdSerializers.err,
	},
};

// Create logger instance based on environment
const createLogger = (): Logger => {
	const isDevelopment = env.NODE_ENV === "development";
	const isTest = env.NODE_ENV === "test";

	// Silent in test environment
	if (isTest) {
		return pino({ level: "silent" });
	}

	// Use appropriate config based on environment
	const config = isDevelopment ? devConfig : prodConfig;
	return pino(config);
};

// Export singleton logger instance
export const logger = createLogger();

// Export child logger factory for services
export const createServiceLogger = (service: string): Logger => {
	return logger.child({ service });
};

// Export types for use in other files
export type { Logger };
