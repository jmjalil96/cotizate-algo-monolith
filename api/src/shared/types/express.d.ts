/**
 * Express Request type extensions
 * Global type augmentations for authentication and authorization context
 */

import type { UserWithLoginContext } from "../../features/auth/shared/repositories/user.repository.js";

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

			/**
			 * Authorization context set by requirePermission middleware
			 * Contains complete user permissions and scope information for data filtering
			 */
			userContext?: {
				userId: string;
				sessionId: string;
				organizationId: string;
				permissions: string[];
				user: UserWithLoginContext;
				scope: {
					canAccessAll: boolean;
					filterType: "own" | "department" | "organization";
					departmentId?: string;
					roleLevel?: string;
				};
			};
		}
	}
}
