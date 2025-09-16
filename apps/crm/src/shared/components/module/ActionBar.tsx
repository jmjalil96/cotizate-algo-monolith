import { ChevronDown, ChevronRight, Filter, Grid3X3, Plus, Table } from "lucide-react";
import type { ActionBarProps } from "./types";

export function ActionBar({
	isFilterOpen = false,
	onFilterToggle,
	viewMode = "table",
	onViewModeChange,
	primaryAction,
	showViewSwitcher = true,
	activeFiltersCount = 0,
}: ActionBarProps) {
	const PrimaryIcon = primaryAction?.icon ?? Plus;

	return (
		<div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
			<div className="flex items-center justify-between">
				{/* Left Section */}
				<div className="flex items-center space-x-2 sm:space-x-4">
					{/* Filter Toggle */}
					<button
						type="button"
						className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs sm:text-sm font-medium transition-colors"
						onClick={onFilterToggle}
					>
						<Filter className="h-4 w-4" />
						<span className="hidden sm:inline">
							Filtros
							{activeFiltersCount > 0 && (
								<span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
									{activeFiltersCount}
								</span>
							)}
						</span>
						<span className="sm:hidden">
							Filtros
							{activeFiltersCount > 0 && (
								<span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
									{activeFiltersCount}
								</span>
							)}
						</span>
						{isFilterOpen ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</button>

					{/* View Mode Switcher */}
					{showViewSwitcher && (
						<div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
							<button
								type="button"
								className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
									viewMode === "table"
										? "text-white shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
								style={viewMode === "table" ? { backgroundColor: "#093FB4" } : {}}
								onClick={() => onViewModeChange?.("table")}
							>
								<Table className="h-3 w-3" />
								<span className="hidden sm:inline">Table</span>
							</button>
							<button
								type="button"
								className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
									viewMode === "kanban"
										? "text-white shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}
								style={viewMode === "kanban" ? { backgroundColor: "#093FB4" } : {}}
								onClick={() => onViewModeChange?.("kanban")}
							>
								<Grid3X3 className="h-3 w-3" />
								<span className="hidden sm:inline">Kanban</span>
							</button>
						</div>
					)}
				</div>

				{/* Right Section - Primary Action */}
				{primaryAction && (
					<button
						type="button"
						className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-white rounded-md text-xs sm:text-sm font-medium transition-colors hover:opacity-90"
						style={{ backgroundColor: "#093FB4" }}
						onClick={primaryAction.onClick}
					>
						<PrimaryIcon className="h-4 w-4" />
						<span className="hidden sm:inline">{primaryAction.label}</span>
						<span className="sm:hidden">{primaryAction.shortLabel ?? primaryAction.label}</span>
					</button>
				)}
			</div>
		</div>
	);
}
