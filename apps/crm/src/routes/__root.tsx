import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ErrorBoundary } from "../shared/components/errors/ErrorBoundary";

export const Route = createRootRoute({
	component: RootComponent,
	errorComponent: ErrorBoundary,
});

function RootComponent() {
	return (
		<>
			<div className="min-h-screen bg-gray-100">
				<Outlet />
			</div>
			{import.meta.env.DEV && <TanStackRouterDevtools />}
		</>
	);
}
