import type { FooterBarProps } from "./types";

export function FooterBar({
	currentPage = 1,
	totalPages = 1,
	itemsPerPage = 10,
	totalItems = 0,
	onPageChange,
	onItemsPerPageChange,
	itemsPerPageOptions = [10, 25, 50, 100],
}: FooterBarProps) {
	const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = Number(e.target.value);
		onItemsPerPageChange?.(value);
	};

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex pagination logic with multiple button types and ellipsis handling
	const renderPageButtons = () => {
		const buttons: React.JSX.Element[] = [];
		const maxVisibleButtons = 5;
		const halfVisible = Math.floor(maxVisibleButtons / 2);

		let startPage = Math.max(1, currentPage - halfVisible);
		const endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

		if (endPage - startPage + 1 < maxVisibleButtons) {
			startPage = Math.max(1, endPage - maxVisibleButtons + 1);
		}

		// Add first page and ellipsis if needed
		if (startPage > 1) {
			buttons.push(
				<button
					key={1}
					type="button"
					className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 transition-colors"
					onClick={() => onPageChange?.(1)}
				>
					1
				</button>,
			);
			if (startPage > 2) {
				buttons.push(
					<span key="ellipsis-start" className="px-2 text-gray-500">
						...
					</span>,
				);
			}
		}

		// Add visible page buttons
		for (let i = startPage; i <= endPage; i++) {
			buttons.push(
				<button
					key={i}
					type="button"
					className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${
						i === currentPage ? "text-white" : "border border-gray-300 hover:bg-gray-50"
					}`}
					style={i === currentPage ? { backgroundColor: "#093FB4" } : {}}
					onClick={() => onPageChange?.(i)}
				>
					{i}
				</button>,
			);
		}

		// Add ellipsis and last page if needed
		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				buttons.push(
					<span key="ellipsis-end" className="px-2 text-gray-500">
						...
					</span>,
				);
			}
			buttons.push(
				<button
					key={totalPages}
					type="button"
					className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 transition-colors"
					onClick={() => onPageChange?.(totalPages)}
				>
					{totalPages}
				</button>,
			);
		}

		return buttons;
	};

	return (
		<div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
			<div className="flex items-center justify-between">
				{/* Left Section - Items per page */}
				<div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-700">
					<span>Showing</span>
					<select
						className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
						value={itemsPerPage}
						onChange={handleItemsPerPageChange}
					>
						{itemsPerPageOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<span className="hidden sm:inline">of {totalItems} results</span>
					<span className="sm:hidden">of {totalItems}</span>
				</div>

				{/* Right Section - Page navigation */}
				<div className="flex items-center space-x-2">
					<button
						type="button"
						className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={currentPage === 1}
						onClick={() => onPageChange?.(currentPage - 1)}
					>
						<span className="hidden sm:inline">Previous</span>
						<span className="sm:hidden">Prev</span>
					</button>

					{/* Page number buttons */}
					<div className="hidden sm:flex items-center space-x-2">{renderPageButtons()}</div>

					{/* Mobile: Show current page of total */}
					<div className="sm:hidden text-xs text-gray-700">
						{currentPage} / {totalPages}
					</div>

					<button
						type="button"
						className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={currentPage === totalPages}
						onClick={() => onPageChange?.(currentPage + 1)}
					>
						<span className="hidden sm:inline">Next</span>
						<span className="sm:hidden">Next</span>
					</button>
				</div>
			</div>
		</div>
	);
}
