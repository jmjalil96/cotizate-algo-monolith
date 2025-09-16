import { X } from "lucide-react";
import type { FilterBarProps } from "./types";

export function FilterBar({
	onApply,
	onClear,
	isOpen = true,
	onClose,
	children,
	hasUnappliedChanges = false,
	pendingChangesCount = 0,
	canApply = true,
}: FilterBarProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<>
			{/* Mobile Overlay */}
			<div className={`lg:hidden ${isOpen ? "block" : "hidden"}`}>
				<div className="fixed inset-0 z-50 flex">
					<button
						type="button"
						className="fixed inset-0 bg-black bg-opacity-50"
						onClick={onClose}
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								onClose?.();
							}
						}}
					/>
					<div className="relative w-full max-w-sm bg-white shadow-xl flex flex-col">
						{/* Mobile Header */}
						<div className="flex items-center justify-between p-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
							<button
								type="button"
								className="p-2 hover:bg-gray-100 rounded-md transition-colors"
								onClick={onClose}
							>
								<X className="h-5 w-5 text-gray-500" />
							</button>
						</div>

						{/* Mobile Content */}
						<div className="p-6 flex-1 overflow-y-auto">{children}</div>

						{/* Mobile Actions */}
						<div className="p-6 pt-0 border-t border-gray-200">
							<div className="flex space-x-3">
								<button
									type="button"
									disabled={!canApply}
									className={`flex-1 px-4 py-2 text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
										hasUnappliedChanges ? "animate-pulse" : ""
									}`}
									style={{
										backgroundColor: hasUnappliedChanges ? "#f59e0b" : "#093FB4",
									}}
									onClick={() => {
										onApply?.();
										onClose?.();
									}}
								>
									{hasUnappliedChanges
										? `Aplicar Cambios${pendingChangesCount > 0 ? ` (${pendingChangesCount})` : ""}`
										: "Aplicar Filtros"}
								</button>
								<button
									type="button"
									className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors"
									onClick={onClear}
								>
									Limpiar
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Desktop Sidebar */}
			<div
				className={`hidden lg:flex lg:flex-col bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
					isOpen ? "lg:w-80" : "lg:w-0 lg:overflow-hidden"
				}`}
			>
				{/* Desktop Content */}
				<div className="p-6 flex-1 overflow-y-auto">{children}</div>

				{/* Desktop Actions */}
				<div className="p-6 border-t border-gray-200">
					<div className="flex space-x-3">
						<button
							type="button"
							disabled={!canApply}
							className={`flex-1 px-4 py-2 text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
								hasUnappliedChanges ? "animate-pulse" : ""
							}`}
							style={{
								backgroundColor: hasUnappliedChanges ? "#f59e0b" : "#093FB4",
							}}
							onClick={onApply}
						>
							{hasUnappliedChanges
								? `Aplicar Cambios${pendingChangesCount > 0 ? ` (${pendingChangesCount})` : ""}`
								: "Aplicar Filtros"}
						</button>
						<button
							type="button"
							className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors"
							onClick={onClear}
						>
							Limpiar
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
