import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { API_CONFIG } from "../../config/api";

class ApiClient {
	private instance: AxiosInstance;
	private clearAuthCallback?: () => void;

	constructor() {
		this.instance = axios.create({
			baseURL: API_CONFIG.baseURL,
			timeout: API_CONFIG.timeout,
			headers: {
				"Content-Type": "application/json",
			},
			withCredentials: true,
		});

		this.setupResponseInterceptor();
	}

	setAuthCallback(clearAuth: () => void) {
		this.clearAuthCallback = clearAuth;
	}

	private setupResponseInterceptor() {
		this.instance.interceptors.response.use(
			(response: AxiosResponse) => response,
			(error) => {
				if (error.response?.status === 401 && this.clearAuthCallback) {
					this.clearAuthCallback();
				}
				return Promise.reject(error);
			},
		);
	}

	async get<T>(url: string): Promise<T> {
		const response = await this.instance.get<T>(url);
		return response.data;
	}

	async post<T, D = unknown>(url: string, data: D): Promise<T> {
		const response = await this.instance.post<T>(url, data);
		return response.data;
	}

	async put<T, D = unknown>(url: string, data: D): Promise<T> {
		const response = await this.instance.put<T>(url, data);
		return response.data;
	}

	async delete<T>(url: string): Promise<T> {
		const response = await this.instance.delete<T>(url);
		return response.data;
	}
}

export const apiClient = new ApiClient();
