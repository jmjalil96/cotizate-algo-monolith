import type { Logger } from "pino";

// Augment Express Request type to include logger
declare global {
	namespace Express {
		interface Request {
			log: Logger;
			id: string;
			startTime: number;
		}
	}
}

// Logger context for tracking request metadata
export interface LoggerContext {
	requestId: string;
	userId?: string;
	sessionId?: string;
	ip?: string;
	userAgent?: string;
	method?: string;
	path?: string;
}

// Error logging format
export interface LogError {
	message: string;
	stack?: string;
	code?: string;
	statusCode?: number;
	details?: unknown;
}

// Custom log event types
export interface LogEvent {
	action: string;
	userId?: string;
	metadata?: Record<string, unknown>;
	duration?: number;
	success: boolean;
}

// Re-export types from pino
export type { Logger } from "pino";
