import type { GetClientsQuery, GetClientsResponse } from "../schemas/clients";
import { apiClient } from "./client";

/**
 * Clients API functions
 * Type-safe integration with backend clients endpoints
 */

/**
 * Get clients with pagination, search, and filtering
 * @param params Query parameters for filtering, sorting, and pagination
 * @returns Paginated clients response
 */
export async function getClients(
	params: Partial<GetClientsQuery> = {},
): Promise<GetClientsResponse> {
	// Build query string from parameters
	const searchParams = new URLSearchParams();

	// Add all non-undefined parameters
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			searchParams.append(key, String(value));
		}
	});

	const queryString = searchParams.toString();
	const url = `/clients${queryString ? `?${queryString}` : ""}`;

	const response = await apiClient.get<GetClientsResponse>(url);

	return response;
}

// Future CRUD functions will be added here:
// export async function createClient(data: CreateClientRequest): Promise<Client>
// export async function updateClient(id: string, data: UpdateClientRequest): Promise<Client>
// export async function deleteClient(id: string): Promise<void>
// export async function getClient(id: string): Promise<Client>
