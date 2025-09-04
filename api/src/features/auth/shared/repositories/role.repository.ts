import type { Prisma, UserRole } from "@prisma/client";
import { notFound } from "../../../../shared/errors/AppError.js";

/**
 * Role repository helper functions
 * Data access layer for role-related operations
 */

/**
 * Assign owner role to a user
 * @param prisma - Prisma client instance (or transaction)
 * @param userId - User ID to assign role to
 * @param organizationId - Organization ID to find the owner role for
 * @returns Created UserRole association
 * @throws AppError if owner role not found
 */
export async function assignOwnerRole(
	prisma: Prisma.TransactionClient,
	userId: string,
	_organizationId: string,
): Promise<UserRole> {
	// Find the system-wide OWNER role (always has null organizationId)
	const ownerRole = await prisma.role.findFirst({
		where: {
			name: "OWNER",
			organizationId: null,
		},
		select: { id: true },
	});

	// Throw error if role doesn't exist
	if (!ownerRole) {
		throw notFound("Owner role");
	}

	// Assign the role to the user
	return prisma.userRole.create({
		data: {
			userId: userId,
			roleId: ownerRole.id,
		},
	});
}
