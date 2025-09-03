import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import { notFound } from "./shared/errors/AppError.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { addRequestStartTime, requestLogger } from "./shared/middleware/requestLogger.js";
import { applySecurity } from "./shared/middleware/security.js";

const app: Express = express();

// Trust proxy for accurate IPs (behind load balancer/proxy)
app.set("trust proxy", 1);

// Request tracking chain (before everything)
app.use(addRequestStartTime);
app.use(requestLogger);

// Expose request ID in response headers
app.use((req: Request, res: Response, next: NextFunction) => {
	res.setHeader("X-Request-Id", String(req.id || ""));
	next();
});

// Apply all security middleware (helmet, cors, rate limit, body parsers)
app.use(applySecurity);

// Routes
app.get("/health", (_req: Request, res: Response) => {
	res.json({ status: "ok" });
});

// 404 handler (JSON, minimal logging)
app.use((req: Request, _res: Response, next: NextFunction) => {
	req.log.warn({ method: req.method, path: req.path }, "Route not found");
	next(notFound("Route"));
});

// Error handler last
app.use(errorHandler);

export default app;
