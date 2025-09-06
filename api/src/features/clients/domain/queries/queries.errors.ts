import { AppError } from "../../../../shared/errors/AppError.js";

/**
 * Client queries domain specific error functions
 * Error handlers for client data retrieval operations
 */

// ============================================
// CLIENT QUERY ERRORS
// ============================================

/**
 * Invalid sort field provided in query parameters
 * Runtime safety check for database field existence
 */
export const invalidSortField = (field: string) =>
	new AppError(
		`Invalid sort field: ${field}. Allowed fields: displayName, email, createdAt, updatedAt`,
		400,
		true,
		"INVALID_SORT_FIELD",
	);

/**
 * Invalid date range where dateFrom is after dateTo
 * Business logic validation for date range queries
 */
export const invalidDateRange = () =>
	new AppError(
		"Invalid date range: dateFrom cannot be after dateTo",
		400,
		true,
		"INVALID_DATE_RANGE",
	);
