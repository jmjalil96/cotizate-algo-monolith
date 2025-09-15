import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { useAuthStore } from "../shared/store/authStore";

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		const { isAuthenticated } = useAuthStore.getState();
		if (isAuthenticated) {
			throw redirect({
				to: "/",
			});
		}
	},
	component: Login,
});

function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { login, isLoading } = useAuthStore();
	const navigate = useNavigate();
	const emailId = useId();
	const passwordId = useId();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login(email, password);
			navigate({ to: "/" });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			alert(`Login failed: ${errorMessage}`);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
				<h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Login</h1>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor={emailId} className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							type="email"
							id={emailId}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							required
						/>
					</div>

					<div>
						<label htmlFor={passwordId} className="block text-sm font-medium text-gray-700">
							Password
						</label>
						<input
							type="password"
							id={passwordId}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
