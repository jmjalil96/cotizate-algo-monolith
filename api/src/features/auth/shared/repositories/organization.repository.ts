import type { Organization, Prisma } from "@prisma/client";

/**
 * Organization repository helper functions
 * Data access layer for organization-related operations
 */

/**
 * Create a new organization
 * @param prisma - Prisma client instance (or transaction)
 * @param name - Organization name
 * @param slug - Unique organization slug
 * @returns Created organization
 */
export async function createOrganization(
	prisma: Prisma.TransactionClient,
	name: string,
	slug: string,
): Promise<Organization> {
	return prisma.organization.create({
		data: {
			name,
			slug,
		},
	});
}
