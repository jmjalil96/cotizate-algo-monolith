export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public isOperational: boolean = true,
		public code?: string,
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

export const emailNotVerified = (email: string) =>
	new AppError(
		`Email ${email} is not verified. Please check your email for verification link.`,
		403,
		true,
		"EMAIL_NOT_VERIFIED",
	);
