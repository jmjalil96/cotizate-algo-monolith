import { createFileRoute } from "@tanstack/react-router";
import { Edit, Eye, UserPlus } from "lucide-react";
import { useState } from "react";
import { ClientFilters } from "../shared/components/filters/ClientFilters";
import { AppShell } from "../shared/components/layout";
import {
	ActionBar,
	DataTable,
	type DataTableAction,
	type DataTableColumn,
	FilterBar,
	FooterBar,
	type ViewMode,
} from "../shared/components/module";
import { useClients } from "../shared/hooks/useClients";
import type { Client, GetClientsQuery } from "../shared/schemas/clients";

export const Route = createFileRoute("/core/clients")({
	component: ClientsPage,
});

function ClientsPage() {
	// Filter and search state
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [emailSearch, setEmailSearch] = useState("");
	const [emailIsValid, setEmailIsValid] = useState(true);
	const [viewMode, setViewMode] = useState<ViewMode>("table");

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);

	// Sort state
	const [sortBy, setSortBy] = useState<GetClientsQuery["sortBy"]>("createdAt");
	const [sortOrder, setSortOrder] = useState<GetClientsQuery["sortOrder"]>("desc");

	// Filter state
	const [clientTypeFilter, setClientTypeFilter] = useState<"INDIVIDUAL" | "COMPANY" | undefined>(
		undefined,
	);
	const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
	const [dateFromFilter, setDateFromFilter] = useState<string | undefined>(undefined);
	const [dateToFilter, setDateToFilter] = useState<string | undefined>(undefined);

	// Track applied filters to detect unapplied changes
	const [appliedFilters, setAppliedFilters] = useState({
		searchValue: "",
		emailSearch: "",
		clientType: undefined as "INDIVIDUAL" | "COMPANY" | undefined,
		isActive: undefined as boolean | undefined,
		dateFrom: undefined as string | undefined,
		dateTo: undefined as string | undefined,
	});

	// TanStack Query integration - replaces manual state management
	const {
		clients,
		pagination,
		isLoading: loading,
		error: queryError,
		refetch,
	} = useClients({
		page: currentPage,
		limit: itemsPerPage,
		sortBy,
		sortOrder,
		appliedFilters, // Pass the stable state object directly
	});

	// Convert Query error to string format (matching existing error handling)
	const error = queryError ? "Error al cargar clientes. Por favor intenta nuevamente." : null;

	// Event handlers (no API calls, just state updates)
	const handleSearch = (value: string) => {
		setSearchValue(value);
	};

	const handleEmailSearch = (value: string, isValid: boolean) => {
		setEmailSearch(value);
		setEmailIsValid(isValid);
	};

	const handleClientTypeChange = (type?: "INDIVIDUAL" | "COMPANY") => {
		setClientTypeFilter(type);
	};

	const handleStatusChange = (status?: boolean) => {
		setStatusFilter(status);
	};

	const handleDateFromChange = (date?: string) => {
		setDateFromFilter(date);
	};

	const handleDateToChange = (date?: string) => {
		setDateToFilter(date);
	};

	const handleSort = (key: string) => {
		const newSortBy = key as GetClientsQuery["sortBy"];
		const newSortOrder = sortBy === newSortBy && sortOrder === "asc" ? "desc" : "asc";
		setSortBy(newSortBy);
		setSortOrder(newSortOrder);
		setCurrentPage(1); // Reset to first page
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (items: number) => {
		setItemsPerPage(items);
		setCurrentPage(1); // Reset to first page
	};

	const handleFilterApply = () => {
		// Don't apply filters if email is invalid
		if (emailSearch && !emailIsValid) {
			// Note: error state now managed by Query, but we can still show validation errors
			return;
		}

		// Update applied filters state - this triggers Query refetch automatically
		setAppliedFilters(getCurrentFilterState());

		// Reset to first page when applying new filters
		setCurrentPage(1);

		// Only close filter bar on mobile
		if (window.innerWidth < 1024) {
			setIsFilterOpen(false);
		}
	};

	const handleFilterClear = () => {
		// Clear all filter state
		setSearchValue("");
		setEmailSearch("");
		setEmailIsValid(true);
		setClientTypeFilter(undefined);
		setStatusFilter(undefined);
		setDateFromFilter(undefined);
		setDateToFilter(undefined);
		setCurrentPage(1);

		// Update applied filters - this triggers Query refetch automatically
		setAppliedFilters({
			searchValue: "",
			emailSearch: "",
			clientType: undefined,
			isActive: undefined,
			dateFrom: undefined,
			dateTo: undefined,
		});

		// Only close filter bar on mobile
		if (window.innerWidth < 1024) {
			setIsFilterOpen(false);
		}
	};

	const handleAddClient = () => {
		// Add client functionality to be implemented
		// Future: Navigate to create client page
	};

	const handleViewClient = (_client: Client) => {
		// View client functionality to be implemented
		// Future: Navigate to client detail page
	};

	const handleEditClient = (_client: Client) => {
		// Edit client functionality to be implemented
		// Future: Navigate to edit client page
	};

	// Get current filter state
	const getCurrentFilterState = () => ({
		searchValue: searchValue.trim(),
		emailSearch: emailIsValid ? emailSearch.trim() : "",
		clientType: clientTypeFilter,
		isActive: statusFilter,
		dateFrom: dateFromFilter,
		dateTo: dateToFilter,
	});

	// Detect unapplied changes
	const hasUnappliedChanges =
		JSON.stringify(appliedFilters) !== JSON.stringify(getCurrentFilterState());

	// Calculate active filters count (only valid filters)
	const activeFiltersCount = [
		searchValue,
		emailSearch && emailIsValid ? emailSearch : null, // Only count valid emails
		clientTypeFilter,
		statusFilter !== undefined,
		dateFromFilter,
		dateToFilter,
	].filter(Boolean).length;

	// Count pending changes
	const pendingChangesCount = hasUnappliedChanges
		? Object.values(getCurrentFilterState()).filter((v) => v !== undefined && v !== "").length
		: 0;

	// Table configuration
	const columns: DataTableColumn<Client>[] = [
		{
			key: "displayName",
			label: "Nombre",
			sortable: true,
			width: "25%",
			render: (_, row) => (
				<div>
					<div className="font-medium text-gray-900">{row.displayName}</div>
					{row.clientType === "INDIVIDUAL" && row.firstName && row.lastName && (
						<div className="text-sm text-gray-500">
							{row.firstName} {row.lastName}
						</div>
					)}
					{row.clientType === "COMPANY" && row.companyName && (
						<div className="text-sm text-gray-500">{row.companyName}</div>
					)}
				</div>
			),
		},
		{
			key: "email",
			label: "Email",
			sortable: true,
			width: "20%",
			render: (value) => <span className="text-gray-900">{String(value)}</span>,
		},
		{
			key: "clientType",
			label: "Tipo",
			width: "12%",
			align: "center",
			render: (value) => (
				<span
					className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
						value === "INDIVIDUAL" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
					}`}
				>
					{value === "INDIVIDUAL" ? "Individual" : "Empresa"}
				</span>
			),
		},
		{
			key: "phoneMobile",
			label: "Teléfono",
			width: "15%",
			render: (_, row) => (
				<div>
					<div className="text-sm text-gray-900">{row.phoneMobile}</div>
					{row.phoneWork && <div className="text-xs text-gray-500">Trabajo: {row.phoneWork}</div>}
				</div>
			),
		},
		{
			key: "isActive",
			label: "Estado",
			width: "10%",
			align: "center",
			render: (value) => (
				<span
					className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
						value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
					}`}
				>
					{value ? "Activo" : "Inactivo"}
				</span>
			),
		},
		{
			key: "createdAt",
			label: "Creado",
			sortable: true,
			width: "12%",
			align: "right",
			render: (value) => {
				const date = new Date(String(value));
				return (
					<div>
						<div className="text-sm text-gray-900">{date.toLocaleDateString("es-ES")}</div>
						<div className="text-xs text-gray-500">
							{date.toLocaleTimeString("es-ES", {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</div>
					</div>
				);
			},
		},
		{
			key: "actions",
			label: "Acciones",
			width: "6%",
			align: "center",
		},
	];

	const actions: DataTableAction<Client>[] = [
		{
			icon: Eye,
			label: "Ver cliente",
			onClick: handleViewClient,
			hoverColor: "#093FB4",
		},
		{
			icon: Edit,
			label: "Editar cliente",
			onClick: handleEditClient,
			hoverColor: "#ED3500",
		},
	];

	return (
		<AppShell currentModule="core" currentPage="clients">
			{/* ActionBar */}
			<ActionBar
				isFilterOpen={isFilterOpen}
				onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
				primaryAction={{
					label: "Nuevo Cliente",
					shortLabel: "Nuevo",
					icon: UserPlus,
					onClick: handleAddClient,
				}}
				showViewSwitcher={true}
				activeFiltersCount={activeFiltersCount}
			/>

			{/* Main Content Layout */}
			<div className="flex flex-1 overflow-hidden">
				{/* Filter Sidebar */}
				<FilterBar
					isOpen={isFilterOpen}
					onApply={handleFilterApply}
					onClear={handleFilterClear}
					onClose={() => setIsFilterOpen(false)}
					hasUnappliedChanges={hasUnappliedChanges}
					pendingChangesCount={pendingChangesCount}
					canApply={!emailSearch || emailIsValid}
				>
					<ClientFilters
						searchValue={searchValue}
						emailSearch={emailSearch}
						clientType={clientTypeFilter}
						isActive={statusFilter}
						dateFrom={dateFromFilter}
						dateTo={dateToFilter}
						onSearchChange={handleSearch}
						onEmailSearchChange={handleEmailSearch}
						onClientTypeChange={handleClientTypeChange}
						onStatusChange={handleStatusChange}
						onDateFromChange={handleDateFromChange}
						onDateToChange={handleDateToChange}
					/>
				</FilterBar>

				{/* Table Content Area - Above Footer */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Error State */}
					{error && (
						<div className="p-4 bg-red-50 border-b border-red-200 flex-shrink-0">
							<p className="text-sm text-red-600">{error}</p>
							<button
								type="button"
								className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
								onClick={() => refetch()}
							>
								Reintentar
							</button>
						</div>
					)}

					{/* Scrollable Table Area */}
					<div className="flex-1 overflow-auto">
						<DataTable
							data={clients}
							columns={columns}
							actions={actions}
							loading={loading}
							loadingRows={itemsPerPage}
							emptyMessage="No se encontraron clientes"
							getRowId={(client) => client.id}
							onRowClick={handleViewClient}
							onSort={handleSort}
							sortKey={sortBy}
							sortDirection={sortOrder}
							selectable={true}
							selectedRows={[]} // Future: implement selection
							onSelectRow={(_id) => {
								// Row selection to be implemented
							}}
							onSelectAll={() => {
								// Select all to be implemented
							}}
						/>
					</div>
				</div>
			</div>

			{/* Fixed Footer - Outside flex container */}
			<FooterBar
				currentPage={currentPage}
				totalPages={pagination.totalPages}
				itemsPerPage={itemsPerPage}
				totalItems={pagination.totalCount}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
				itemsPerPageOptions={[10, 20, 50, 100]}
			/>
		</AppShell>
	);
}
