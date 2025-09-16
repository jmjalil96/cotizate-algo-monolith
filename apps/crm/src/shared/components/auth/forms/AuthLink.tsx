import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface AuthLinkProps {
	children: ReactNode;
	href?: string;
	onClick?: () => void;
	variant?: "primary" | "secondary";
	className?: string;
}

export function AuthLink({
	children,
	href,
	onClick,
	variant = "primary",
	className = "",
}: AuthLinkProps) {
	const baseClasses = "font-medium hover:underline transition-colors duration-200";

	const variantClasses = {
		primary: "text-blue-600 hover:text-blue-700",
		secondary: "text-gray-600 hover:text-gray-700",
	};

	const linkClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

	const linkStyle = {
		color: variant === "primary" ? "#093FB4" : undefined,
	} as React.CSSProperties;

	if (href) {
		const isInternal = href.startsWith("/");
		if (isInternal) {
			return (
				<Link to={href} className={linkClasses} style={linkStyle}>
					{children}
				</Link>
			);
		}
		return (
			<a href={href} className={linkClasses} style={linkStyle}>
				{children}
			</a>
		);
	}

	return (
		<button type="button" onClick={onClick} className={linkClasses} style={linkStyle}>
			{children}
		</button>
	);
}
