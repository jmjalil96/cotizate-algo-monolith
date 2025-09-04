import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting seed...");

	// Create wildcard permission for complete system access
	const wildcardPermission = await prisma.permission.upsert({
		where: { name: "*:*:*" },
		update: {},
		create: {
			name: "*:*:*",
			resource: "*",
			action: "*",
			scope: "SYSTEM",
			description: "Full system access",
		},
	});
	console.log("✓ Created wildcard permission (*:*:*)");

	// Create system-wide OWNER role
	// First check if it exists
	let ownerRole = await prisma.role.findFirst({
		where: {
			name: "OWNER",
			organizationId: null,
		},
	});

	if (!ownerRole) {
		ownerRole = await prisma.role.create({
			data: {
				name: "OWNER",
				organizationId: null, // System-wide role
			},
		});
	}
	console.log("✓ Created OWNER role");

	// Assign wildcard permission to OWNER role
	await prisma.rolePermission.upsert({
		where: {
			roleId_permissionId: {
				roleId: ownerRole.id,
				permissionId: wildcardPermission.id,
			},
		},
		update: {},
		create: {
			roleId: ownerRole.id,
			permissionId: wildcardPermission.id,
		},
	});
	console.log("✓ Assigned *:*:* permission to OWNER role");

	console.log("✅ Seed completed successfully!");
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
