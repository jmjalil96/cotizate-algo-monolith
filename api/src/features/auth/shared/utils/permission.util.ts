import type { UserWithLoginContext } from "../repositories/user.repository.js";

/**
 * Permission utility functions
 * Handles flattening complex RBAC structure for UI consumption
 */

/**
 * Flatten user permissions from complex RBAC structure to simple string array
 * Converts User → UserRole → Role → RolePermission → Permission to ["resource:action"]
 * @param user - User with roles and permissions loaded
 * @returns Array of permission strings in "resource:action" format
 */
export function flattenUserPermissions(user: UserWithLoginContext): string[] {
	const permissions = new Set<string>(); // Use Set to avoid duplicates

	// Iterate through user roles
	for (const userRole of user.roles) {
		const role = userRole.role;

		// Iterate through role permissions
		for (const rolePermission of role.permissions) {
			const permission = rolePermission.permission;

			// Format as "resource:action" (e.g., "users:create", "clients:read")
			const permissionString = `${permission.resource}:${permission.action}`;
			permissions.add(permissionString);
		}
	}

	// Convert Set back to Array and sort for consistency
	return Array.from(permissions).sort();
}

/**
 * Check if user has a specific permission
 * Utility function for permission checking (can be used in middleware)
 * @param user - User with permissions loaded
 * @param resource - Resource name (e.g., "users", "clients")
 * @param action - Action name (e.g., "create", "read", "update", "delete")
 * @returns True if user has the permission
 */
export function hasPermission(
	user: UserWithLoginContext,
	resource: string,
	action: string,
): boolean {
	const targetPermission = `${resource}:${action}`;
	const wildcard = `${resource}:*`;
	const superWildcard = "*:*";

	// Check for specific permission, resource wildcard, or super admin
	for (const userRole of user.roles) {
		for (const rolePermission of userRole.role.permissions) {
			const permission = rolePermission.permission;
			const permissionString = `${permission.resource}:${permission.action}`;

			if (
				permissionString === targetPermission ||
				permissionString === wildcard ||
				permissionString === superWildcard
			) {
				return true;
			}
		}
	}

	return false;
}
