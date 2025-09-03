import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z
		.string()
		.default("3000")
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().positive()),
	API_VERSION: z.string().default("v1"),
	LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
	// Security
	CORS_ORIGIN: z.string().default("*"),
	RATE_LIMIT_WINDOW_MS: z
		.string()
		.default("900000")
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().positive()),
	RATE_LIMIT_MAX: z
		.string()
		.default("100")
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().positive()),
	MAX_JSON_SIZE: z.string().default("10mb"),
	// Compression
	COMPRESSION_ENABLED: z
		.string()
		.default("true")
		.transform((val) => val === "true"),
	COMPRESSION_THRESHOLD: z.string().default("1kb"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("Invalid environment variables:", parsedEnv.error.format());
	process.exit(1);
}

type Env = z.infer<typeof envSchema>;

export const env = parsedEnv.data;
export type { Env };
