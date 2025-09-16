import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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

// Create QueryClient with reasonable defaults for CRM usage
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
			retry: 2,
			refetchOnWindowFocus: false,
		},
	},
});

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

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
