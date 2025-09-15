import { create } from "zustand";
import { apiClient } from "../api/client";
import type { LoginRequest, LoginResponse, MeResponse, User } from "../types/auth";

interface AuthStore {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;

	login: (email: string, password: string) => Promise<void>;
	logout: (everywhere?: boolean) => Promise<void>;
	checkAuth: () => Promise<void>;
	clearAuth: () => void;
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
	};

	// Connect API client to auth store
	apiClient.setAuthCallback(store.clearAuth);

	return store;
});
