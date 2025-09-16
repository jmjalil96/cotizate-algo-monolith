/**
 * Navigation types and interfaces for TopNavBar and SecondaryNavBar components
 */

export interface NavPage {
	id: string;
	label: string;
}

export interface ModuleConfig {
	label: string;
	pages: NavPage[];
}

export interface TopNavBarProps {
	currentModule?: string;
	userName?: string;
	onNavigate?: (module: string) => void;
	onSettingsClick?: () => void;
	onSignOut?: () => void;
}

export interface SecondaryNavBarProps {
	currentModule?: string;
	currentPage?: string;
	onNavigate?: (page: string) => void;
}

export interface UserMenuProps {
	userName: string;
	isOpen: boolean;
	onClose: () => void;
	onSettingsClick?: () => void;
	onSignOut?: () => void;
}
