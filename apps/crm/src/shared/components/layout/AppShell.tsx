import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuthStore } from "../../store/authStore";
import { SecondaryNavBar, TopNavBar } from "../navigation";

interface AppShellProps {
	children: ReactNode;
	currentModule?: string;
	currentPage?: string;
}

export function AppShell({ children, currentModule = "dashboard", currentPage }: AppShellProps) {
	const { user, logout } = useAuthStore();
	const navigate = useNavigate();

	const handleModuleNavigate = (moduleId: string) => {
		// Navigate to module root or dashboard
		if (moduleId === "dashboard") {
			navigate({ to: "/" });
		} else if (moduleId === "core") {
			navigate({ to: "/core/clients" });
		} else {
			// For other modules, navigate to dashboard for now
			navigate({ to: "/" });
		}
	};

	const handlePageNavigate = (_pageId: string) => {
		// Navigate to specific page within current module
		// For now, navigate to dashboard - will be enhanced with proper page routing
		navigate({ to: "/" });
	};

	const handleSettingsClick = () => {
		// Navigate to settings page - will be implemented later
	};

	const handleSignOut = async () => {
		try {
			await logout();
			navigate({ to: "/login" });
		} catch (_error) {
			// Handle logout error silently and redirect anyway
			navigate({ to: "/login" });
		}
	};

	// Get user display name
	const userName = user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : "Usuario";

	return (
		<div className="h-screen flex flex-col bg-gray-50">
			<TopNavBar
				currentModule={currentModule}
				userName={userName}
				onNavigate={handleModuleNavigate}
				onSettingsClick={handleSettingsClick}
				onSignOut={handleSignOut}
			/>

			<SecondaryNavBar
				currentModule={currentModule}
				currentPage={currentPage}
				onNavigate={handlePageNavigate}
			/>

			{children}
		</div>
	);
}
