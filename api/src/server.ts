import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const server = app.listen(env.PORT, () => {
	logger.info(
		{
			port: env.PORT,
			environment: env.NODE_ENV,
			pid: process.pid,
		},
		`Server running on port ${env.PORT}`,
	);
});

// Set timeouts for production
if (env.NODE_ENV === "production") {
	server.keepAliveTimeout = 65000;
	server.headersTimeout = 66000;
}

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
	logger.info({ signal }, "Shutdown signal received");

	server.close(() => {
		logger.info("Server closed successfully");
		process.exit(0);
	});

	// Force exit only in production after timeout
	if (env.NODE_ENV === "production") {
		setTimeout(() => {
			logger.error("Forced shutdown after timeout");
			process.exit(1);
		}, 10000);
	}
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Fatal error handling (production only)
if (env.NODE_ENV === "production") {
	process.on("uncaughtException", (error) => {
		logger.fatal({ error }, "Uncaught exception");
		process.exit(1);
	});

	process.on("unhandledRejection", (reason) => {
		logger.fatal({ reason }, "Unhandled rejection");
		process.exit(1);
	});
}
