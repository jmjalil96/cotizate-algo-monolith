import type { PrismaClient } from "@prisma/client";
import { GetClientsService } from "../../domain/queries/getClients.service.js";

/**
 * Client Services Interface
 * Defines all client-related services available through the factory
 */
export interface ClientServices {
	getClientsService: GetClientsService;
	// Future services can be added here:
	// createClientService: CreateClientService;
	// updateClientService: UpdateClientService;
	// deleteClientService: DeleteClientService;
}

/**
 * Create Client Services Factory
 * Factory pattern for dependency injection and easier testing
 * @param prisma - Prisma client instance (can be mocked for testing)
 * @returns Object containing all client services
 */
export function createClientServices(prisma: PrismaClient): ClientServices {
	return {
		getClientsService: new GetClientsService(prisma),
		// Future services initialization:
		// createClientService: new CreateClientService(prisma),
		// updateClientService: new UpdateClientService(prisma),
		// deleteClientService: new DeleteClientService(prisma),
	};
}

/**
 * Create Mock Client Services Factory (for testing)
 * @param overrides - Partial services to override
 * @returns Mocked client services
 */
export function createMockClientServices(overrides?: Partial<ClientServices>): ClientServices {
	return {
		getClientsService: overrides?.getClientsService || ({} as GetClientsService),
		// Future mock services:
		// createClientService: overrides?.createClientService || ({} as CreateClientService),
		// updateClientService: overrides?.updateClientService || ({} as UpdateClientService),
		// deleteClientService: overrides?.deleteClientService || ({} as DeleteClientService),
	};
}
