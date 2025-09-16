import { useQuery } from "@tanstack/react-query";
import { getClients } from "../api/clients";
import type { GetClientsQuery } from "../schemas/clients";

/**
 * useClients Hook
 * TanStack Query integration for client data management
 * Provides caching, background updates, and error handling
 */

interface UseClientsParams {
	// Pagination parameters
	page: number;
	limit: number;

	// Sort parameters
	sortBy: GetClientsQuery["sortBy"];
	sortOrder: GetClientsQuery["sortOrder"];

	// Applied filters (only these trigger queries)
	appliedFilters: {
		searchValue: string;
		emailSearch: string;
		clientType?: "INDIVIDUAL" | "COMPANY";
		isActive?: boolean;
		dateFrom?: string;
		dateTo?: string;
	};
}

interface UseClientsResult {
	clients: import("../schemas/clients").Client[];
	pagination: {
		page: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

export function useClients(params: UseClientsParams): UseClientsResult {
	const { page, limit, sortBy, sortOrder, appliedFilters } = params;

	// Generate stable query key for caching
	// Each unique combination of parameters gets its own cache entry
	const queryKey = [
		"clients",
		{
			page,
			limit,
			sortBy,
			sortOrder,
			// Flatten appliedFilters to ensure stable comparison
			searchValue: appliedFilters.searchValue || "",
			emailSearch: appliedFilters.emailSearch || "",
			clientType: appliedFilters.clientType,
			isActive: appliedFilters.isActive,
			dateFrom: appliedFilters.dateFrom,
			dateTo: appliedFilters.dateTo,
		},
	] as const;

	// Build API query parameters
	const buildQueryParams = (): Partial<GetClientsQuery> => {
		// Convert date filters to ISO datetime format (same as manual implementation)
		const dateFromISO = appliedFilters.dateFrom
			? `${appliedFilters.dateFrom}T00:00:00.000Z`
			: undefined;
		const dateToISO = appliedFilters.dateTo ? `${appliedFilters.dateTo}T23:59:59.999Z` : undefined;

		return {
			page,
			limit,
			sortBy,
			sortOrder,
			// Applied filters only (preserves manual application UX)
			...(appliedFilters.searchValue?.trim() && {
				displayName: appliedFilters.searchValue.trim(),
			}),
			...(appliedFilters.emailSearch?.trim() && {
				email: appliedFilters.emailSearch.trim(),
			}),
			...(appliedFilters.clientType && {
				clientType: appliedFilters.clientType,
			}),
			...(appliedFilters.isActive !== undefined && {
				isActive: appliedFilters.isActive,
			}),
			...(dateFromISO && { dateFrom: dateFromISO }),
			...(dateToISO && { dateTo: dateToISO }),
		};
	};

	// TanStack Query hook
	const query = useQuery({
		queryKey,
		queryFn: () => getClients(buildQueryParams()),
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
	});

	// Default pagination for loading states
	const defaultPagination = {
		page: 1,
		limit: 20,
		totalCount: 0,
		totalPages: 0,
		hasNextPage: false,
		hasPrevPage: false,
	};

	return {
		clients: query.data?.clients ?? [],
		pagination: query.data?.pagination ?? defaultPagination,
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}
