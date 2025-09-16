import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface AuthButtonProps {
	children: ReactNode;
	type?: "button" | "submit" | "reset";
	variant?: "primary" | "secondary";
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
	loading?: boolean;
	loadingText?: string;
	icon?: boolean;
	className?: string;
	onClick?: () => void;
}

const sizeClasses = {
	sm: "py-2 px-4 text-sm",
	md: "py-3 px-5 text-base",
	lg: "py-4 px-6 text-lg",
};

export function AuthButton({
	children,
	type = "button",
	variant = "primary",
	size = "lg",
	disabled = false,
	loading = false,
	loadingText,
	icon = true,
	className = "",
	onClick,
}: AuthButtonProps) {
	const isDisabled = disabled || loading;

	const baseClasses =
		"w-full flex justify-center items-center border border-transparent font-medium rounded-xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

	const variantClasses = {
		primary: `text-white ${loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"}`,
		secondary: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200",
	};

	const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

	const buttonStyle = {
		backgroundColor: loading ? "#6B7280" : variant === "primary" ? "#093FB4" : undefined,
		"--tw-ring-color": variant === "primary" ? "rgba(9, 63, 180, 0.3)" : "rgba(9, 63, 180, 0.1)",
	} as React.CSSProperties;

	return (
		<button
			type={type}
			disabled={isDisabled}
			onClick={onClick}
			className={buttonClasses}
			style={buttonStyle}
		>
			{loading ? (
				<div className="flex items-center">
					<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
					{loadingText || "Cargando..."}
				</div>
			) : (
				<div className="flex items-center">
					{children}
					{icon && variant === "primary" && <ArrowRight className="ml-2 h-5 w-5" />}
				</div>
			)}
		</button>
	);
}
