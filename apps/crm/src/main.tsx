import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import { useAuthStore } from "./shared/store/authStore";
import "./index.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function App() {
	const [isAuthInitialized, setIsAuthInitialized] = useState(false);

	useEffect(() => {
		const initAuth = async () => {
			await useAuthStore.getState().checkAuth();
			setIsAuthInitialized(true);
		};
		initAuth();
	}, []);

	if (!isAuthInitialized) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-gray-600">Loading...</div>
			</div>
		);
	}

	return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
