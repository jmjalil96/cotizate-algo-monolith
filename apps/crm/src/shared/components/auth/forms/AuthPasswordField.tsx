import { Eye, EyeOff, Lock } from "lucide-react";
import { forwardRef, useState } from "react";
import { AuthFormField } from "./AuthFormField";

interface AuthPasswordFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	error?: { message?: string };
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

export const AuthPasswordField = forwardRef<HTMLInputElement, AuthPasswordFieldProps>(
	({ name, label, placeholder, error, required, disabled, className, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false);

		return (
			<AuthFormField
				{...props}
				ref={ref}
				name={name}
				label={label}
				type={showPassword ? "text" : "password"}
				placeholder={placeholder}
				icon={Lock}
				error={error}
				required={required}
				disabled={disabled}
				className={className}
			>
				<button
					type="button"
					onClick={() => setShowPassword(!showPassword)}
					className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
					tabIndex={-1}
				>
					{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
				</button>
			</AuthFormField>
		);
	},
);

AuthPasswordField.displayName = "AuthPasswordField";
