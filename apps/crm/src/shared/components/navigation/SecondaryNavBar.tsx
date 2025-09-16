import { brandColors, moduleConfig } from "./config";
import type { SecondaryNavBarProps } from "./types";

export function SecondaryNavBar({ currentModule, currentPage, onNavigate }: SecondaryNavBarProps) {
	// Don't show secondary nav if no module is selected or module has no pages
	if (!currentModule || !moduleConfig[currentModule]) {
		return null;
	}

	const module = moduleConfig[currentModule];

	return (
		<div className="bg-white border-b border-gray-200 shadow-sm sticky top-14 z-40">
			<div className="px-4 sm:px-6">
				<div className="flex items-center h-12">
					{/* Module Label - Mobile Only */}
					<span className="lg:hidden text-sm font-medium text-gray-500 mr-4">{module.label}:</span>

					{/* Navigation Pills */}
					<div className="flex items-center space-x-1 overflow-x-auto">
						{module.pages.map((page) => (
							<button
								key={page.id}
								type="button"
								className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
									currentPage === page.id
										? "bg-blue-600 text-white shadow-sm"
										: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
								}`}
								style={currentPage === page.id ? { backgroundColor: brandColors.primary } : {}}
								onClick={() => onNavigate?.(page.id)}
							>
								{page.label}
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
