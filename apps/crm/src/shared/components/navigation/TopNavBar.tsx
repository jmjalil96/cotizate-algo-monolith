import { Building2, ChevronDown, Menu, Settings, User, X } from "lucide-react";
import { useState } from "react";
import { brandColors, navModules } from "./config";
import type { TopNavBarProps } from "./types";

export function TopNavBar({
	currentModule = "dashboard",
	userName = "Admin User",
	onNavigate,
	onSettingsClick,
	onSignOut,
}: TopNavBarProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

	const handleModuleClick = (moduleId: string) => {
		if (onNavigate) {
			onNavigate(moduleId);
		}
		setIsMobileMenuOpen(false);
	};

	return (
		<nav
			className="text-white shadow-lg border-b border-slate-700 sticky top-0 z-50"
			style={{ backgroundColor: brandColors.primary }}
		>
			<div className="flex items-center justify-between h-14 px-4 sm:px-6">
				{/* Left Section - Brand & Primary Nav */}
				<div className="flex items-center space-x-8">
					{/* Logo */}
					<div className="flex items-center space-x-2">
						<Building2 className="h-6 w-6" style={{ color: brandColors.secondary }} />
						<span className="text-lg font-semibold">
							<span style={{ color: "white" }}>Cotízate</span>
							<span style={{ color: brandColors.secondary }}>Algo</span>
						</span>
					</div>

					{/* Desktop Navigation - Main Modules Only */}
					<div className="hidden lg:flex items-center space-x-2">
						{navModules.map((module) => (
							<button
								key={module.id}
								type="button"
								className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
									currentModule === module.id
										? "text-blue-900 bg-white shadow-sm"
										: "text-white text-opacity-90 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10"
								}`}
								onClick={() => handleModuleClick(module.id)}
							>
								{module.label}
							</button>
						))}
					</div>
				</div>

				{/* Right Section - User Actions */}
				<div className="flex items-center space-x-4">
					{/* Settings Button - Desktop Only */}
					<button
						type="button"
						className="hidden sm:block p-2 rounded-md transition-colors hover:bg-white hover:bg-opacity-10"
						onClick={onSettingsClick}
					>
						<Settings className="h-5 w-5" />
					</button>

					{/* User Menu */}
					<div className="relative">
						<button
							type="button"
							className="flex items-center space-x-2 p-2 rounded-md transition-colors hover:bg-white hover:bg-opacity-10"
							onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
						>
							<User className="h-5 w-5" />
							<span className="hidden sm:inline text-sm">{userName}</span>
							<ChevronDown
								className={`hidden sm:inline h-4 w-4 transition-transform duration-200 ${
									isUserMenuOpen ? "rotate-180" : ""
								}`}
							/>
						</button>

						{/* User Dropdown Menu */}
						{isUserMenuOpen && (
							<>
								{/* Backdrop */}
								<button
									type="button"
									className="fixed inset-0 z-10"
									onClick={() => setIsUserMenuOpen(false)}
									onKeyDown={(e) => {
										if (e.key === "Escape") {
											setIsUserMenuOpen(false);
										}
									}}
								/>
								{/* Dropdown */}
								<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
									<div className="px-4 py-2 border-b border-gray-200">
										<p className="text-sm font-medium text-gray-900">{userName}</p>
										<p className="text-xs text-gray-500">Administrator</p>
									</div>
									<button
										type="button"
										className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										onClick={() => {
											setIsUserMenuOpen(false);
											onSettingsClick?.();
										}}
									>
										<Settings className="inline h-4 w-4 mr-2" />
										Settings
									</button>
									<button
										type="button"
										className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										onClick={() => {
											setIsUserMenuOpen(false);
											onSignOut?.();
										}}
									>
										Sign Out
									</button>
								</div>
							</>
						)}
					</div>

					{/* Mobile Menu Toggle */}
					<button
						type="button"
						className="lg:hidden p-2 rounded-md transition-colors hover:bg-white hover:bg-opacity-10"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					>
						{isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</button>
				</div>
			</div>

			{/* Mobile Navigation Menu */}
			{isMobileMenuOpen && (
				<div className="lg:hidden border-t border-slate-600">
					<div className="px-2 pt-2 pb-3 space-y-1">
						{navModules.map((module) => (
							<button
								key={module.id}
								type="button"
								className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
									currentModule === module.id
										? "bg-white text-blue-900"
										: "text-white hover:bg-white hover:bg-opacity-10"
								}`}
								onClick={() => handleModuleClick(module.id)}
							>
								{module.label}
							</button>
						))}
						<hr className="border-slate-600" />
						<button
							type="button"
							className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-white hover:bg-opacity-10"
							onClick={() => {
								setIsMobileMenuOpen(false);
								onSettingsClick?.();
							}}
						>
							<Settings className="inline h-4 w-4 mr-2" />
							Settings
						</button>
					</div>
				</div>
			)}
		</nav>
	);
}
