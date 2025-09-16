import { forwardRef } from "react";

interface AuthCheckboxProps {
	name: string;
	label: string;
	disabled?: boolean;
	className?: string;
}

export const AuthCheckbox = forwardRef<HTMLInputElement, AuthCheckboxProps>(
	({ name, label, disabled, className = "", ...props }, ref) => {
		const inputId = `auth-checkbox-${name}`;

		return (
			<label className={`flex items-center cursor-pointer ${className}`}>
				<input
					{...props}
					ref={ref}
					id={inputId}
					name={name}
					type="checkbox"
					disabled={disabled}
					className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					style={{ accentColor: "#093FB4" }}
				/>
				<span className="ml-2 text-sm text-gray-700">{label}</span>
			</label>
		);
	},
);

AuthCheckbox.displayName = "AuthCheckbox";
