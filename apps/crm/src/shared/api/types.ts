export interface ApiResponse<T = unknown> {
	data: T;
	message?: string;
}

export interface ApiError {
	message: string;
	code?: string | number;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
