import type {
	Organization,
	Permission,
	Prisma,
	PrismaClient,
	Profile,
	Role,
	RolePermission,
	User,
	UserRole,
} from "@prisma/client";
import { MAX_LOGIN_ATTEMPTS } from "../constants/registration.constants.js";

/**
 * User repository helper functions
 * Data access layer for user-related queries
 */

/**
 * Check if an email already exists in the system
 * @param prisma - Prisma client instance
 * @param email - Email to check (will be normalized to lowercase)
 * @returns True if email exists, false otherwise
 */
export async function checkEmailExists(
	prisma: PrismaClient | Prisma.TransactionClient,
	email: string,
): Promise<boolean> {
	const normalizedEmail = email.toLowerCase().trim();

	const user = await prisma.user.findUnique({
		where: { email: normalizedEmail },
		select: { id: true }, // Only select id for performance
	});

	return user !== null;
}

/**
 * Get user by email with verification status
 * @param prisma - Prisma client instance
 * @param email - Email to look up (will be normalized to lowercase)
 * @returns User with id and verification status, or null if not found
 */
export async function getUserByEmail(
	prisma: PrismaClient | Prisma.TransactionClient,
	email: string,
): Promise<{ id: string; verified: boolean } | null> {
	const normalizedEmail = email.toLowerCase().trim();

	return await prisma.user.findUnique({
		where: { email: normalizedEmail },
		select: { id: true, verified: true },
	});
}

/**
 * Create a new user with profile
 * @param prisma - Prisma client instance (or transaction)
 * @param data - User creation data
 * @returns Created user with profile
 */
export async function createUser(
	prisma: Prisma.TransactionClient,
	data: {
		email: string;
		passwordHash: string;
		organizationId: string;
		firstName: string;
		lastName: string;
	},
): Promise<User & { profile: Profile | null }> {
	return prisma.user.create({
		data: {
			email: data.email.toLowerCase().trim(),
			password: data.passwordHash,
			organizationId: data.organizationId,
			verified: false, // Will be true after OTP verification
			profile: {
				create: {
					firstName: data.firstName,
					lastName: data.lastName,
				},
			},
		},
		include: {
			profile: true,
		},
	});
}

/**
 * Mark user as verified after successful email verification
 * @param prisma - Prisma transaction client
 * @param userId - User ID to mark as verified
 * @returns Updated user
 */
export async function markUserVerified(
	prisma: Prisma.TransactionClient,
	userId: string,
): Promise<User> {
	const now = new Date();

	return prisma.user.update({
		where: { id: userId },
		data: {
			verified: true,
			verifiedAt: now,
		},
	});
}

// ============================================
// LOGIN FUNCTIONS
// ============================================

/**
 * Type definition for user with complete login context
 */
export type UserWithLoginContext = User & {
	profile: Profile | null;
	organization: Organization & {
		deletedAt: Date | null;
	};
	roles: Array<
		UserRole & {
			role: Role & {
				permissions: Array<
					RolePermission & {
						permission: Permission;
					}
				>;
			};
		}
	>;
};

/**
 * Find user for login with complete context (profile, organization, roles, permissions)
 * Returns all data needed for authentication and authorization
 * @param prisma - Prisma client instance
 * @param email - Email address to look up (will be normalized to lowercase)
 * @returns User with complete login context or null if not found
 */
export async function findUserForLogin(
	prisma: PrismaClient | Prisma.TransactionClient,
	email: string,
): Promise<UserWithLoginContext | null> {
	const normalizedEmail = email.toLowerCase().trim();

	return await prisma.user.findUnique({
		where: { email: normalizedEmail },
		include: {
			profile: true,
			organization: true,
			roles: {
				include: {
					role: {
						include: {
							permissions: {
								include: {
									permission: true,
								},
							},
						},
					},
				},
			},
		},
	});
}

/**
 * Increment user login attempts and lock account if max attempts reached
 * @param prisma - Prisma transaction client
 * @param userId - User ID to update
 * @param currentAttempts - Current login attempt count
 * @returns Updated user with potentially locked status
 */
export async function incrementUserLoginAttempts(
	prisma: Prisma.TransactionClient,
	userId: string,
	currentAttempts: number,
): Promise<User> {
	const newAttempts = currentAttempts + 1;
	const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

	return prisma.user.update({
		where: { id: userId },
		data: {
			loginAttempts: newAttempts,
			isLocked: shouldLock,
		},
	});
}

/**
 * Reset user login attempts to 0 on successful login
 * @param prisma - Prisma transaction client
 * @param userId - User ID to update
 * @returns Updated user with cleared attempts
 */
export async function resetUserLoginAttempts(
	prisma: Prisma.TransactionClient,
	userId: string,
): Promise<User> {
	return prisma.user.update({
		where: { id: userId },
		data: {
			loginAttempts: 0,
		},
	});
}

/**
 * Update user last login timestamp
 * @param prisma - Prisma transaction client
 * @param userId - User ID to update
 * @returns Updated user with current login time
 */
export async function updateUserLastLogin(
	prisma: Prisma.TransactionClient,
	userId: string,
): Promise<User> {
	const now = new Date();

	return prisma.user.update({
		where: { id: userId },
		data: {
			lastLoginAt: now,
		},
	});
}
