import type { ReactNode } from "react";
import { Logo } from "../branding/Logo";

interface AuthContainerProps {
	children: ReactNode;
	title: string;
	subtitle: string;
	showLogo?: boolean;
}

export function AuthContainer({ children, title, subtitle, showLogo = true }: AuthContainerProps) {
	return (
		<>
			{/* Logo and Header */}
			<div className="text-center mb-12">
				{showLogo && <Logo className="mb-8" size="xl" />}

				<div className="space-y-2">
					<h2 className="text-3xl font-bold text-gray-900">{title}</h2>
					<p className="text-gray-600 text-lg">{subtitle}</p>
				</div>
			</div>

			{children}
		</>
	);
}
