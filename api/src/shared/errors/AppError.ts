export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public isOperational: boolean = true,
	) {
		super(message);
		Object.setPrototypeOf(this, AppError.prototype);
	}
}

// Common error factory functions
export const notFound = (resource: string) => new AppError(`${resource} not found`, 404);

export const unauthorized = (message = "Unauthorized") => new AppError(message, 401);

export const forbidden = (message = "Forbidden") => new AppError(message, 403);

export const badRequest = (message: string) => new AppError(message, 400);

export const conflict = (message: string) => new AppError(message, 409);
