import { create } from "zustand";
import { apiClient } from "../api/client";
import type {
	ForgotPasswordRequest,
	ForgotPasswordResponse,
	RegisterRequest,
	RegisterResponse,
	ResendCodeRequest,
	ResendCodeResponse,
	ResetPasswordRequest,
	ResetPasswordResponse,
	VerifyEmailRequest,
	VerifyEmailResponse,
} from "../schemas/auth";
import type { LoginRequest, LoginResponse, MeResponse, User } from "../types/auth";

interface AuthStore {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;

	login: (email: string, password: string) => Promise<void>;
	logout: (everywhere?: boolean) => Promise<void>;
	checkAuth: () => Promise<void>;
	clearAuth: () => void;

	// Registration methods
	register: (data: RegisterRequest) => Promise<RegisterResponse>;
	verifyEmail: (data: VerifyEmailRequest) => Promise<VerifyEmailResponse>;
	resendCode: (data: ResendCodeRequest) => Promise<ResendCodeResponse>;

	// Password reset methods
	forgotPassword: (data: ForgotPasswordRequest) => Promise<ForgotPasswordResponse>;
	resetPassword: (data: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
}

export const useAuthStore = create<AuthStore>((set) => {
	const store = {
		user: null,
		isAuthenticated: false,
		isLoading: false,

		login: async (email: string, password: string) => {
			set({ isLoading: true });
			try {
				const response = await apiClient.post<LoginResponse, LoginRequest>("/auth/login", {
					email,
					password,
				});
				set({
					user: response.user,
					isAuthenticated: true,
					isLoading: false,
				});
			} catch (_error) {
				set({ isLoading: false });
				throw _error;
			}
		},

		logout: async (everywhere = false) => {
			set({ isLoading: true });
			try {
				await apiClient.post("/auth/logout", { everywhere });
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			} catch (_error) {
				// Clear auth state even if logout fails
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			}
		},

		checkAuth: async () => {
			set({ isLoading: true });
			try {
				const response = await apiClient.get<MeResponse>("/auth/me");
				set({
					user: response.user,
					isAuthenticated: true,
					isLoading: false,
				});
			} catch (_error) {
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			}
		},

		clearAuth: () => {
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
			});
		},

		// Registration methods
		register: async (data: RegisterRequest) => {
			set({ isLoading: true });
			try {
				const response = await apiClient.post<RegisterResponse, RegisterRequest>(
					"/auth/register",
					data,
				);
				set({ isLoading: false });
				return response;
			} catch (error) {
				set({ isLoading: false });
				throw error;
			}
		},

		verifyEmail: async (data: VerifyEmailRequest) => {
			set({ isLoading: true });
			try {
				const response = await apiClient.post<VerifyEmailResponse, VerifyEmailRequest>(
					"/auth/verify-email",
					data,
				);
				set({ isLoading: false });
				return response;
			} catch (error) {
				set({ isLoading: false });
				throw error;
			}
		},

		resendCode: async (data: ResendCodeRequest) => {
			set({ isLoading: true });
			try {
				const response = await apiClient.post<ResendCodeResponse, ResendCodeRequest>(
					"/auth/resend-code",
					data,
				);
				set({ isLoading: false });
				return response;
			} catch (error) {
				set({ isLoading: false });
				throw error;
			}
		},

		// Password reset methods
		forgotPassword: async (data: ForgotPasswordRequest) => {
			set({ isLoading: true });
			try {
				const response = await apiClient.post<ForgotPasswordResponse, ForgotPasswordRequest>(
					"/auth/forgot-password",
					data,
				);
				set({ isLoading: false });
				return response;
			} catch (error) {
				set({ isLoading: false });
				throw error;
			}
		},

		resetPassword: async (data: ResetPasswordRequest) => {
			set({ isLoading: true });
			try {
				const response = await apiClient.post<ResetPasswordResponse, ResetPasswordRequest>(
					"/auth/reset-password",
					data,
				);
				set({ isLoading: false });
				return response;
			} catch (error) {
				set({ isLoading: false });
				throw error;
			}
		},
	};

	// Connect API client to auth store
	apiClient.setAuthCallback(store.clearAuth);

	return store;
});
