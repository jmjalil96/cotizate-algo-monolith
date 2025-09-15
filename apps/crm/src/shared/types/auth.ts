export interface User {
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
	permissions: string[];
}

export interface Session {
	id: string;
	expiresAt: string;
	lastActivity: string;
	tokenLastFour: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	success: boolean;
	message: string;
	user: User;
	session: Session;
}

export interface LogoutRequest {
	everywhere?: boolean;
}

export interface LogoutResponse {
	success: boolean;
	message: string;
	sessionsRevoked: number;
}

export interface MeResponse {
	user: User;
	session: Session;
}
