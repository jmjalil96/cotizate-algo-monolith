import { AlertCircle, Building, Calendar, Mail, Users } from "lucide-react";
import { useId } from "react";
import { z } from "zod";

interface ClientFiltersProps {
	// Filter values
	searchValue: string;
	emailSearch: string;
	clientType?: "INDIVIDUAL" | "COMPANY";
	isActive?: boolean;
	dateFrom?: string;
	dateTo?: string;

	// Event handlers
	onSearchChange: (value: string) => void;
	onEmailSearchChange: (value: string, isValid: boolean) => void;
	onClientTypeChange: (type?: "INDIVIDUAL" | "COMPANY") => void;
	onStatusChange: (isActive?: boolean) => void;
	onDateFromChange: (date?: string) => void;
	onDateToChange: (date?: string) => void;
}

export function ClientFilters({
	searchValue,
	emailSearch,
	clientType,
	isActive,
	dateFrom,
	dateTo,
	onSearchChange,
	onEmailSearchChange,
	onClientTypeChange,
	onStatusChange,
	onDateFromChange,
	onDateToChange,
}: ClientFiltersProps) {
	const displayNameSearchId = useId();
	const emailSearchId = useId();

	// Validate email format using Zod (same as backend)
	const isValidEmail = (email: string) => {
		if (!email.trim()) return true; // Empty is valid (no filter)
		try {
			z.string().email().parse(email);
			return true;
		} catch {
			return false;
		}
	};

	const emailIsValid = isValidEmail(emailSearch);
	return (
		<div className="space-y-6">
			{/* Display Name Search */}
			<div>
				<label
					htmlFor={displayNameSearchId}
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					Buscar por nombre
				</label>
				<div className="relative">
					<Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						id={displayNameSearchId}
						type="text"
						placeholder="Nombre del cliente..."
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:border-blue-500 focus:outline-none"
						style={{ "--tw-ring-color": "#093FB4" } as React.CSSProperties}
					/>
				</div>
			</div>

			{/* Email Search */}
			<div>
				<label htmlFor={emailSearchId} className="block text-sm font-medium text-gray-700 mb-2">
					Buscar por email
				</label>
				<div className="relative">
					<Mail
						className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
							emailSearch && !emailIsValid ? "text-red-400" : "text-gray-400"
						}`}
					/>
					<input
						id={emailSearchId}
						type="email"
						placeholder="Email del cliente..."
						value={emailSearch}
						onChange={(e) => {
							const value = e.target.value;
							const isValid = isValidEmail(value);
							onEmailSearchChange(value, isValid);
						}}
						className={`w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:outline-none ${
							emailSearch && !emailIsValid
								? "border-red-300 focus:border-red-500 focus:ring-red-100"
								: "border-gray-300 focus:border-blue-500"
						}`}
						style={
							{
								"--tw-ring-color": emailSearch && !emailIsValid ? "#fecaca" : "#093FB4",
							} as React.CSSProperties
						}
					/>
					{emailSearch && !emailIsValid && (
						<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
							<AlertCircle className="h-4 w-4 text-red-400" />
						</div>
					)}
				</div>
				{emailSearch && !emailIsValid && (
					<p className="mt-1 text-sm text-red-600">Formato de email inválido</p>
				)}
			</div>

			{/* Client Type Filter */}
			<div>
				<div className="block text-sm font-medium text-gray-700 mb-2">Tipo de cliente</div>
				<div className="relative">
					<Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<select
						value={clientType || ""}
						onChange={(e) =>
							onClientTypeChange(
								(e.target.value as "INDIVIDUAL" | "COMPANY" | undefined) || undefined,
							)
						}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:border-blue-500 focus:outline-none appearance-none"
						style={{ "--tw-ring-color": "#093FB4" } as React.CSSProperties}
					>
						<option value="">Todos los tipos</option>
						<option value="INDIVIDUAL">Individual</option>
						<option value="COMPANY">Empresa</option>
					</select>
				</div>
			</div>

			{/* Status Filter */}
			<div>
				<div className="block text-sm font-medium text-gray-700 mb-2">Estado</div>
				<div className="flex space-x-2">
					<button
						type="button"
						onClick={() => onStatusChange(undefined)}
						className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isActive === undefined
								? "bg-blue-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
						style={isActive === undefined ? { backgroundColor: "#093FB4" } : {}}
					>
						Todos
					</button>
					<button
						type="button"
						onClick={() => onStatusChange(true)}
						className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isActive === true
								? "bg-green-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						Activos
					</button>
					<button
						type="button"
						onClick={() => onStatusChange(false)}
						className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isActive === false
								? "bg-red-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						Inactivos
					</button>
				</div>
			</div>

			{/* Date Range Filter */}
			<div>
				<div className="block text-sm font-medium text-gray-700 mb-2">Fecha de creación</div>
				<div className="space-y-3">
					<div className="relative">
						<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="date"
							placeholder="Desde..."
							value={dateFrom || ""}
							onChange={(e) => onDateFromChange(e.target.value || undefined)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:border-blue-500 focus:outline-none"
							style={{ "--tw-ring-color": "#093FB4" } as React.CSSProperties}
						/>
					</div>
					<div className="relative">
						<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="date"
							placeholder="Hasta..."
							value={dateTo || ""}
							onChange={(e) => onDateToChange(e.target.value || undefined)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:border-blue-500 focus:outline-none"
							style={{ "--tw-ring-color": "#093FB4" } as React.CSSProperties}
						/>
					</div>
				</div>
			</div>

			{/* Quick Date Presets */}
			<div>
				<div className="block text-sm font-medium text-gray-700 mb-2">Accesos rápidos</div>
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={() => {
							const today = new Date().toISOString().split("T")[0];
							onDateFromChange(today);
							onDateToChange(today);
						}}
						className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
					>
						Hoy
					</button>
					<button
						type="button"
						onClick={() => {
							const today = new Date();
							const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
							onDateFromChange(lastWeek.toISOString().split("T")[0]);
							onDateToChange(today.toISOString().split("T")[0]);
						}}
						className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
					>
						Última semana
					</button>
					<button
						type="button"
						onClick={() => {
							const today = new Date();
							const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
							const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
							onDateFromChange(lastMonth.toISOString().split("T")[0]);
							onDateToChange(lastMonthEnd.toISOString().split("T")[0]);
						}}
						className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
					>
						Mes pasado
					</button>
					<button
						type="button"
						onClick={() => {
							onDateFromChange(undefined);
							onDateToChange(undefined);
						}}
						className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
					>
						Limpiar fechas
					</button>
				</div>
			</div>
		</div>
	);
}
