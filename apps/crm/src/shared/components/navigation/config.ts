import type { ModuleConfig } from "./types";

/**
 * Module configuration for navigation system
 * Defines the structure of modules and their associated pages
 */

export const navModules = [
	{ id: "dashboard", label: "Dashboard" },
	{ id: "core", label: "Core" },
	{ id: "sac", label: "SAC" },
	{ id: "billing", label: "Facturación" },
	{ id: "commissions", label: "Comisiones" },
];

export const moduleConfig: Record<string, ModuleConfig> = {
	dashboard: {
		label: "Dashboard",
		pages: [
			{ id: "overview", label: "Resumen" },
			{ id: "analytics", label: "Analíticas" },
			{ id: "reports", label: "Reportes" },
			{ id: "activities", label: "Actividades" },
		],
	},
	core: {
		label: "Core",
		pages: [
			{ id: "clients", label: "Clientes" },
			{ id: "accounts", label: "Cuentas" },
			{ id: "policies", label: "Pólizas" },
		],
	},
	sac: {
		label: "SAC",
		pages: [
			{ id: "reimbursements", label: "Reembolsos" },
			{ id: "medical-care", label: "Atenciones Médicas" },
			{ id: "claims", label: "Siniestros" },
		],
	},
	billing: {
		label: "Facturación",
		pages: [{ id: "pre-settlements", label: "Preliquidaciones" }],
	},
	commissions: {
		label: "Comisiones",
		pages: [
			{ id: "settlements", label: "Liquidaciones" },
			{ id: "cuts", label: "Cortes" },
			{ id: "invoices", label: "Facturas" },
		],
	},
};

/**
 * Brand colors for consistent styling
 */
export const brandColors = {
	primary: "#093FB4", // CotízateAlgo blue
	secondary: "#ED3500", // CotízateAlgo red
} as const;
