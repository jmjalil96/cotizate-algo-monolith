/**
 * Registration Types - Internal types for /register and /verify-email endpoint service logic
 */

// ============================================
// SERVICE INPUT/OUTPUT TYPES
// ============================================

/**
 * What the service receives from the controller (after DTO validation)
 */
export interface RegisterInput {
	// User information
	firstName: string;
	lastName: string;
	email: string; // Already lowercase from DTO
	password: string; // Will be hashed by service

	// Organization information
	organizationName: string;

	// Request context (from middleware)
	ipAddress: string;
	userAgent: string;
}

/**
 * What the service returns to the controller
 */
export interface RegisterResult {
	otpExpiresAt: Date;
}

/**
 * What the verification service receives from the controller (after DTO validation)
 */
export interface VerifyEmailInput {
	// User information
	email: string; // Already lowercase from DTO
	otpCode: string; // Already validated format from DTO

	// Request context (from middleware)
	ipAddress: string;
	userAgent: string;
}

/**
 * What the verification service returns to the controller
 */
export interface VerifyEmailResult {
	success: boolean;
	message: string;
}

/**
 * What the resend service receives from the controller (after DTO validation)
 */
export interface ResendInput {
	// User information
	email: string; // Already lowercase from DTO

	// Request context (from middleware)
	ipAddress: string;
	userAgent: string;
}

/**
 * What the resend service returns to the controller
 */
export interface ResendResult {
	success: boolean;
	message: string;
	otpExpiresAt?: Date; // When new OTP expires (success case)
	newSessionId?: string; // New session ID (for internal logging only)
}

/**
 * What the login service receives from the controller (after DTO validation)
 */
export interface LoginInput {
	// User information
	email: string; // Already lowercase from DTO
	password: string; // Plain password for verification

	// Request context (from middleware)
	ipAddress: string;
	userAgent: string;
}

/**
 * What the login service returns to the controller
 */
export interface LoginResult {
	success: boolean;
	message: string;
	user: {
		id: string;
		email: string;
		verified: boolean;
		profile: {
			firstName: string;
			lastName: string;
		};
		organization: {
			id: string;
			name: string;
			slug: string;
		};
		permissions: string[]; // Flattened permissions for UI (e.g., ["users:create", "clients:read"])
	};
	session: {
		id: string;
		expiresAt: Date; // Date object (not string like DTO)
		lastActivity: Date;
		tokenLastFour: string;
	};
}

/**
 * What the logout service receives from the controller (after DTO validation)
 */
export interface LogoutInput {
	// From DTO
	everywhere?: boolean; // Optional bulk logout flag

	// Request context (from middleware)
	ipAddress: string;
	userAgent: string;
}

/**
 * What the logout service returns to the controller
 */
export interface LogoutResult {
	success: boolean; // Always true (idempotent design)
	message: string; // User-friendly message
	sessionsRevoked: number; // Count of sessions terminated
}

/**
 * What the me service receives from the controller (after authentication)
 */
export interface MeInput {
	// User information (from auth context)
	userId: string; // From req.auth.userId
	sessionId: string; // From req.auth.sessionId

	// Request context (from middleware)
	ipAddress: string;
	userAgent: string;
}

/**
 * What the me service returns to the controller
 * Same structure as LoginResult but without action wrapper (success/message)
 */
export interface MeResult {
	user: {
		id: string;
		email: string;
		verified: boolean;
		profile: {
			firstName: string;
			lastName: string;
		};
		organization: {
			id: string;
			name: string;
			slug: string;
		};
		permissions: string[]; // Flattened permissions for UI (e.g., ["users:create", "clients:read"])
	};
	session: {
		id: string;
		expiresAt: Date; // Date object (not string like DTO)
		lastActivity: Date;
		tokenLastFour: string;
	};
}
