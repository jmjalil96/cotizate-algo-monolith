import type { LucideIcon } from "lucide-react";
import { forwardRef, type ReactNode, useState } from "react";

interface AuthFormFieldProps {
	name: string;
	label: string;
	type?: "text" | "email" | "tel" | "url" | "password";
	placeholder?: string;
	icon?: LucideIcon;
	error?: { message?: string };
	required?: boolean;
	disabled?: boolean;
	className?: string;
	children?: ReactNode;
}

function getInputClassName(
	Icon: LucideIcon | undefined,
	children: ReactNode,
	error: { message?: string } | undefined,
) {
	const baseClasses =
		"block w-full py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
	const paddingClasses = `${Icon ? "pl-12" : "pl-4"} ${children ? "pr-12" : "pr-4"}`;
	const errorClasses = error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "";

	return `${baseClasses} ${paddingClasses} ${errorClasses}`;
}

function getInputStyle(isFocused: boolean, error: { message?: string } | undefined) {
	return {
		"--tw-ring-color": error ? "rgba(239, 68, 68, 0.1)" : "rgba(9, 63, 180, 0.1)",
		borderColor: isFocused && !error ? "#093FB4" : error ? "#ef4444" : "",
	} as React.CSSProperties;
}

export const AuthFormField = forwardRef<HTMLInputElement, AuthFormFieldProps>(
	(
		{
			name,
			label,
			type = "text",
			placeholder,
			icon: Icon,
			error,
			required,
			disabled,
			className = "",
			children,
			...props
		},
		ref,
	) => {
		const [focusedField, setFocusedField] = useState<string | null>(null);
		const inputId = `auth-field-${name}`;
		const isFocused = focusedField === name;

		return (
			<div className={`space-y-2 ${className}`}>
				<label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</label>
				<div className="relative">
					{Icon && (
						<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<Icon
								className={`h-5 w-5 transition-colors duration-200 ${
									isFocused ? "text-blue-600" : "text-gray-400"
								}`}
								style={isFocused ? { color: "#093FB4" } : {}}
							/>
						</div>
					)}
					<input
						{...props}
						ref={ref}
						id={inputId}
						name={name}
						type={type}
						placeholder={placeholder}
						disabled={disabled}
						onFocus={() => setFocusedField(name)}
						onBlur={() => setFocusedField(null)}
						aria-invalid={error ? "true" : "false"}
						aria-describedby={error ? `${inputId}-error` : undefined}
						className={getInputClassName(Icon, children, error)}
						style={getInputStyle(isFocused, error)}
					/>
					{children && (
						<div className="absolute inset-y-0 right-0 pr-4 flex items-center">{children}</div>
					)}
				</div>
				{error && (
					<p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
						{error.message}
					</p>
				)}
			</div>
		);
	},
);

AuthFormField.displayName = "AuthFormField";
