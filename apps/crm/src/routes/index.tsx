import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../shared/store/authStore";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		const { isAuthenticated } = useAuthStore.getState();
		if (!isAuthenticated) {
			throw redirect({
				to: "/login",
			});
		}
	},
	component: Dashboard,
});

function Dashboard() {
	const { user, logout, isLoading } = useAuthStore();
	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			await logout();
			navigate({ to: "/login" });
		} catch (_error) {
			// Handle logout error silently
			navigate({ to: "/login" });
		}
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header with logout button */}
			<div className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
						<button
							type="button"
							onClick={handleLogout}
							disabled={isLoading}
							className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
						>
							{isLoading ? "Logging out..." : "Logout"}
						</button>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex items-center justify-center py-12">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome back!</h2>
					<p className="text-gray-600">
						Hello, {user?.profile.firstName} {user?.profile.lastName}
					</p>
					<p className="text-sm text-gray-500 mt-2">Organization: {user?.organization.name}</p>
					<p className="text-xs text-gray-400 mt-1">Permissions: {user?.permissions.join(", ")}</p>
				</div>
			</div>
		</div>
	);
}
