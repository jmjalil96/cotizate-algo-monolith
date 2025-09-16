import { forwardRef } from "react";
import { AuthPasswordField } from "../auth/forms/AuthPasswordField";

interface PasswordConfirmFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	password: string;
	error?: { message?: string };
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

export const PasswordConfirmField = forwardRef<HTMLInputElement, PasswordConfirmFieldProps>(
	({ name, label, placeholder, password, error, required, disabled, className, ...props }, ref) => {
		// password prop is used for form validation, not directly in this component
		return (
			<AuthPasswordField
				{...props}
				ref={ref}
				name={name}
				label={label}
				placeholder={placeholder}
				error={error}
				required={required}
				disabled={disabled}
				className={className}
			/>
		);
	},
);

PasswordConfirmField.displayName = "PasswordConfirmField";
