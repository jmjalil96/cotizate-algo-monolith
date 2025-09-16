import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "../shared/components/layout";
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
	const { user } = useAuthStore();

	return (
		<AppShell currentModule="dashboard" currentPage="overview">
			{/* Dashboard Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
					<p className="text-gray-600">Bienvenido a tu panel de control</p>
				</div>

				{/* Welcome Card */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<div className="bg-white rounded-lg shadow-lg p-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">¡Bienvenido de vuelta!</h2>
							<div className="space-y-2">
								<p className="text-lg text-gray-700">
									Hola, {user?.profile.firstName} {user?.profile.lastName}
								</p>
								<p className="text-sm text-gray-500">Organización: {user?.organization.name}</p>
								<p className="text-xs text-gray-400">Permisos: {user?.permissions.join(", ")}</p>
							</div>
						</div>
					</div>

					{/* Quick Stats */}
					<div className="space-y-4">
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas</h3>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-gray-600">Clientes activos</span>
									<span className="font-medium">1,234</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Pólizas vigentes</span>
									<span className="font-medium">2,456</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Siniestros pendientes</span>
									<span className="font-medium text-orange-600">12</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
