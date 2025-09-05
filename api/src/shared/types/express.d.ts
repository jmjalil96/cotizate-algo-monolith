/**
 * Express Request type extensions
 * Global type augmentations for authentication context
 */

declare global {
	namespace Express {
		interface Request {
			/**
			 * Authentication context set by authenticate middleware
			 * Contains minimal user session information for protected routes
			 */
			auth?: {
				userId: string;
				sessionId: string;
				organizationId: string;
			};
		}
	}
}

export {};
