export const API_CONFIG = {
	// Prefer env var for flexibility across environments
	baseURL: import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1",
	timeout: 10000,
} as const;
