import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../features/auth/shared/utils/password.util.js";

const prisma = new PrismaClient();

/**
 * Seed script for clients endpoint testing
 * Creates test organization, super admin user, and 50 diverse clients
 */

// Sample data arrays for realistic client generation
const INDIVIDUAL_FIRST_NAMES = [
	"Juan",
	"María",
	"Carlos",
	"Ana",
	"Luis",
	"Carmen",
	"José",
	"Elena",
	"Miguel",
	"Isabel",
	"Antonio",
	"Rosa",
	"Francisco",
	"Laura",
	"Manuel",
	"Pilar",
	"David",
	"Cristina",
	"Pedro",
	"Marta",
];

const INDIVIDUAL_LAST_NAMES = [
	"García",
	"Rodríguez",
	"González",
	"Fernández",
	"López",
	"Martínez",
	"Sánchez",
	"Pérez",
	"Gómez",
	"Martín",
	"Jiménez",
	"Ruiz",
	"Hernández",
	"Díaz",
	"Moreno",
	"Muñoz",
	"Álvarez",
	"Romero",
	"Alonso",
	"Gutiérrez",
];

const COMPANY_NAMES = [
	"TechSolutions SA",
	"Constructora Del Sur",
	"Distribuidora Central",
	"Servicios Integrales",
	"Comercial Paraguay",
	"Industrias Unidas",
	"Logística Total",
	"Desarrollo Urbano",
	"Consultoría Empresarial",
	"Manufacturas Nacionales",
	"Importadora Regional",
	"Servicios Financieros",
	"Agropecuaria Nacional",
	"Telecomunicaciones Avanzadas",
	"Energía Sostenible",
	"Transporte Ejecutivo",
	"Marketing Digital",
	"Seguros Generales",
	"Farmacéutica Central",
	"Textiles Modernos",
];

const OCCUPATIONS = [
	"Ingeniero",
	"Médico",
	"Abogado",
	"Contador",
	"Arquitecto",
	"Profesor",
	"Comerciante",
	"Empresario",
	"Consultor",
	"Técnico",
	"Administrador",
	"Vendedor",
	"Analista",
];

const INDUSTRY_TYPES = [
	"Tecnología",
	"Construcción",
	"Comercio",
	"Servicios",
	"Manufactura",
	"Agricultura",
	"Transporte",
	"Educación",
	"Salud",
	"Finanzas",
	"Energía",
	"Telecomunicaciones",
];

const ECONOMIC_ACTIVITIES = [
	"Venta de software",
	"Construcción residencial",
	"Comercio minorista",
	"Consultoría empresarial",
	"Servicios profesionales",
	"Producción industrial",
	"Agricultura y ganadería",
	"Transporte de carga",
	"Servicios educativos",
	"Atención médica",
	"Servicios financieros",
	"Desarrollo inmobiliario",
];

function getRandomElement<T>(array: T[]): T {
	const element = array[Math.floor(Math.random() * array.length)];
	if (!element) throw new Error("Array is empty");
	return element;
}

function generateRandomEmail(name: string, isCompany = false): string {
	const domain = isCompany ? "empresa.com" : "email.com";
	const cleanName = name
		.toLowerCase()
		.replace(/\s+/g, "")
		.replace(/[áéíóú]/g, (m) => {
			const map: Record<string, string> = { á: "a", é: "e", í: "i", ó: "o", ú: "u" };
			return map[m] || m;
		});
	return `${cleanName}@${domain}`;
}

function generateRandomPhone(): string {
	const areaCode = Math.floor(Math.random() * 900) + 100;
	const number = Math.floor(Math.random() * 9000000) + 1000000;
	return `0${areaCode}-${number}`;
}

function generateCedula(): string {
	// Simple cedula generation (not real validation)
	const number = Math.floor(Math.random() * 9000000) + 1000000;
	return number.toString();
}

function generateRUC(): string {
	// Simple RUC generation (not real validation)
	const number = Math.floor(Math.random() * 900000000) + 100000000;
	return `${number}-1`;
}

function getRandomDateInPast(daysBack: number): Date {
	const now = new Date();
	const randomDays = Math.floor(Math.random() * daysBack);
	return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
}

async function main() {
	console.log("🌱 Starting clients seed...");

	try {
		// 1. Create test organization
		const organization = await prisma.organization.create({
			data: {
				name: "Test Organization",
				slug: "test-org-seed",
			},
		});
		console.log("✅ Organization created:", organization.name);

		// 2. Create super admin user
		const passwordHash = await hashPassword("SuperAdmin123");
		const user = await prisma.user.create({
			data: {
				email: "admin@test-org.com",
				password: passwordHash,
				verified: true,
				organizationId: organization.id,
				profile: {
					create: {
						firstName: "Super",
						lastName: "Admin",
					},
				},
			},
		});
		console.log("✅ Super admin user created:", user.email);

		// 3. Assign OWNER role with *:* permissions
		const ownerRole = await prisma.role.findFirst({
			where: { name: "OWNER", organizationId: null },
		});

		if (ownerRole) {
			await prisma.userRole.create({
				data: {
					userId: user.id,
					roleId: ownerRole.id,
				},
			});
			console.log("✅ OWNER role assigned");

			// 4. Connect *:* permission to OWNER role if not already connected
			const starPermission = await prisma.permission.findFirst({
				where: { resource: "*", action: "*" },
			});

			if (starPermission) {
				const existingRolePermission = await prisma.rolePermission.findFirst({
					where: { roleId: ownerRole.id, permissionId: starPermission.id },
				});

				if (!existingRolePermission) {
					await prisma.rolePermission.create({
						data: {
							roleId: ownerRole.id,
							permissionId: starPermission.id,
						},
					});
					console.log("✅ *:* permission connected to OWNER role");
				}
			}
		}

		// 4. Create 30 INDIVIDUAL clients
		console.log("🧑 Creating 30 individual clients...");
		for (let i = 0; i < 30; i++) {
			const firstName = getRandomElement(INDIVIDUAL_FIRST_NAMES);
			const lastName = getRandomElement(INDIVIDUAL_LAST_NAMES);
			const displayName = `${firstName} ${lastName}`;
			const email = generateRandomEmail(displayName);

			await prisma.client.create({
				data: {
					// Individual fields
					firstName,
					lastName,
					sex: getRandomElement(["MASCULINO", "FEMENINO", "OTRO"]),
					dateOfBirth: new Date(
						1944 + Math.floor(Math.random() * 60),
						Math.floor(Math.random() * 12),
						Math.floor(Math.random() * 28) + 1,
					),
					occupation: getRandomElement(OCCUPATIONS),

					// Common fields
					displayName,
					clientType: "INDIVIDUAL",

					// Identification
					idType: "CEDULA",
					idNumber: generateCedula(),

					// Contact
					email,
					phoneMobile: generateRandomPhone(),
					phoneWork: Math.random() > 0.5 ? generateRandomPhone() : null,

					// Business
					economicActivity: getRandomElement(ECONOMIC_ACTIVITIES),

					// Organization & Ownership
					organizationId: organization.id,
					ownerId: user.id,

					// Status
					isActive: Math.random() > 0.1, // 90% active

					// Audit
					createdById: user.id,
					createdAt: getRandomDateInPast(180), // Last 6 months
				},
			});

			if ((i + 1) % 10 === 0) {
				console.log(`   Created ${i + 1}/30 individual clients`);
			}
		}

		// 5. Create 20 COMPANY clients
		console.log("🏢 Creating 20 company clients...");
		for (let i = 0; i < 20; i++) {
			const companyName = getRandomElement(COMPANY_NAMES);
			const displayName = companyName;
			const email = generateRandomEmail(companyName, true);

			await prisma.client.create({
				data: {
					// Company fields
					companyName,
					industryType: getRandomElement(INDUSTRY_TYPES),
					companySize: getRandomElement(["MICRO", "PEQUENA", "MEDIANA", "GRANDE"]),
					foundedDate: new Date(
						1990 + Math.floor(Math.random() * 30),
						Math.floor(Math.random() * 12),
						Math.floor(Math.random() * 28) + 1,
					),
					legalStructure: getRandomElement(["SA", "SRL", "SAS", "COOPERATIVA", "UNIPERSONAL"]),

					// Common fields
					displayName,
					clientType: "COMPANY",

					// Identification
					idType: "RUC",
					idNumber: generateRUC(),

					// Contact
					email,
					phoneMobile: generateRandomPhone(),
					phoneWork: generateRandomPhone(),

					// Business
					economicActivity: getRandomElement(ECONOMIC_ACTIVITIES),

					// Organization & Ownership
					organizationId: organization.id,
					ownerId: user.id,

					// Status
					isActive: Math.random() > 0.05, // 95% active

					// Audit
					createdById: user.id,
					createdAt: getRandomDateInPast(180), // Last 6 months
				},
			});

			if ((i + 1) % 10 === 0) {
				console.log(`   Created ${i + 1}/20 company clients`);
			}
		}

		console.log("🎉 Clients seed completed successfully!");
		console.log("📊 Summary:");
		console.log(`   Organization: ${organization.name} (${organization.slug})`);
		console.log(`   User: ${user.email} (password: SuperAdmin123)`);
		console.log("   Clients: 30 individuals + 20 companies = 50 total");
		console.log("");
		console.log("🧪 Test the endpoint:");
		console.log("   GET /api/v1/clients");
		console.log("   GET /api/v1/clients?clientType=INDIVIDUAL&limit=10");
		console.log("   GET /api/v1/clients?displayName=juan&isActive=true");
		console.log("   GET /api/v1/clients?page=2&limit=25");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("💥 Seed script failed:", error);
	process.exit(1);
});
