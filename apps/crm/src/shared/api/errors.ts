import axios from "axios";

export interface NormalizedApiError<T = unknown> {
	message: string;
	status?: number;
	data?: T;
	// Enhanced error classification
	isNetwork?: boolean;
	isTimeout?: boolean;
	retryAfterSeconds?: number;
}

// biome-ignore lint/suspicious/noExplicitAny: Required for runtime type checking of unknown errors
export function normalizeApiError<T = any>(error: unknown): NormalizedApiError<T> {
	// Pass through if it's already normalized
	if (
		error &&
		typeof error === "object" &&
		// biome-ignore lint/suspicious/noExplicitAny: Runtime type checking requires any
		typeof (error as any).message === "string" &&
		// biome-ignore lint/suspicious/noExplicitAny: Runtime type checking requires any
		((error as any).status === undefined || typeof (error as any).status === "number")
	) {
		return error as NormalizedApiError<T>;
	}
	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		const data = error.response?.data as T | undefined;

		// Network and timeout error classification
		const isNetwork = error.code === "ERR_NETWORK";
		const isTimeout = error.code === "ECONNABORTED";

		// Parse Retry-After header for rate limiting
		const retryAfterHeader = error.response?.headers["retry-after"];
		const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

		// Enhanced Spanish error messages
		let message: string;
		if (isNetwork) {
			message = "No se pudo conectar. Verifica tu conexión.";
		} else if (isTimeout) {
			message = "La solicitud expiró. Intenta nuevamente.";
		} else {
			// Use server message if available, fallback to generic
			// biome-ignore lint/suspicious/noExplicitAny: Server response format is unknown
			message = (data as any)?.message || error.message || "Error del servidor";
		}

		return {
			message,
			status,
			data,
			isNetwork,
			isTimeout,
			retryAfterSeconds,
		};
	}
	if (error instanceof Error) {
		return { message: error.message };
	}
	return { message: "Unknown error" };
}
