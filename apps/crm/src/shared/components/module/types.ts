import type { LucideIcon } from "lucide-react";

/**
 * Module layout component types and interfaces
 */

export interface PrimaryAction {
	label: string;
	shortLabel?: string;
	icon?: LucideIcon;
	onClick: () => void;
}

export interface ActionBarProps {
	isFilterOpen?: boolean;
	onFilterToggle?: () => void;
	viewMode?: "table" | "kanban";
	onViewModeChange?: (mode: "table" | "kanban") => void;
	primaryAction?: PrimaryAction;
	showViewSwitcher?: boolean;
	activeFiltersCount?: number;
}

export interface FilterBarProps {
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	onApply?: () => void;
	onClear?: () => void;
	isOpen?: boolean;
	onClose?: () => void;
	children?: React.ReactNode;
	hasUnappliedChanges?: boolean;
	pendingChangesCount?: number;
	canApply?: boolean;
}

export interface FooterBarProps {
	currentPage?: number;
	totalPages?: number;
	itemsPerPage?: number;
	totalItems?: number;
	onPageChange?: (page: number) => void;
	onItemsPerPageChange?: (itemsPerPage: number) => void;
	itemsPerPageOptions?: number[];
}

export type ViewMode = "table" | "kanban";

// ============================================
// DATA TABLE TYPES
// ============================================

export interface DataTableColumn<T> {
	key: keyof T | "actions";
	label: string;
	sortable?: boolean;
	width?: string;
	align?: "left" | "center" | "right";
	render?: (value: unknown, row: T) => React.ReactNode;
	className?: string;
}

export interface DataTableAction<T> {
	icon: LucideIcon;
	label: string;
	onClick: (row: T) => void;
	color?: string;
	hoverColor?: string;
	show?: (row: T) => boolean;
}

export interface DataTableProps<T> {
	data: T[];
	columns: DataTableColumn<T>[];
	actions?: DataTableAction<T>[];
	selectable?: boolean;
	selectedRows?: string[];
	onSelectRow?: (id: string) => void;
	onSelectAll?: () => void;
	onSort?: (key: string) => void;
	sortKey?: string;
	sortDirection?: "asc" | "desc";
	loading?: boolean;
	loadingRows?: number;
	emptyMessage?: string;
	getRowId: (row: T) => string;
	onRowClick?: (row: T) => void;
	rowClassName?: (row: T) => string;
}
