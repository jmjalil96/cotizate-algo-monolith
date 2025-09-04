import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import {
	SLUG_MAX_ATTEMPTS,
	SLUG_RANDOM_SUFFIX_LENGTH,
} from "../constants/registration.constants.js";

/**
 * Slug generation utilities
 * Handles organization slug creation with uniqueness checks
 */

/**
 * Generate a basic slug from a name
 * @param name - Name to convert to slug
 * @returns Slug-formatted string
 */
export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
		.replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
		.replace(/-+/g, "-"); // Replace multiple hyphens with single
}

/**
 * Generate a random suffix for slug collision handling
 * @returns Random alphanumeric string
 */
function generateRandomSuffix(): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = randomBytes(SLUG_RANDOM_SUFFIX_LENGTH);
	let suffix = "";

	for (let i = 0; i < SLUG_RANDOM_SUFFIX_LENGTH; i++) {
		const byte = bytes[i];
		if (byte !== undefined) {
			suffix += chars[byte % chars.length];
		}
	}

	return suffix;
}

/**
 * Generate a unique slug with retry logic
 * @param prisma - Prisma client for database checks
 * @param organizationName - Organization name to create slug from
 * @returns Unique slug string
 * @throws Error if unable to generate unique slug after max attempts
 */
export async function generateUniqueSlug(
	prisma: Prisma.TransactionClient,
	organizationName: string,
): Promise<string> {
	const baseSlug = generateSlug(organizationName);

	// Try base slug first
	const existing = await prisma.organization.findUnique({
		where: { slug: baseSlug },
		select: { id: true },
	});

	if (!existing) {
		return baseSlug;
	}

	// If base slug exists, try with random suffixes
	for (let attempt = 1; attempt <= SLUG_MAX_ATTEMPTS; attempt++) {
		const suffix = generateRandomSuffix();
		const slugWithSuffix = `${baseSlug}-${suffix}`;

		const existingWithSuffix = await prisma.organization.findUnique({
			where: { slug: slugWithSuffix },
			select: { id: true },
		});

		if (!existingWithSuffix) {
			return slugWithSuffix;
		}
	}

	throw new Error(`Unable to generate unique slug after ${SLUG_MAX_ATTEMPTS} attempts`);
}
