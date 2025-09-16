import type { ReactNode } from "react";
import { AuthVisual } from "./AuthVisual";

interface AuthLayoutProps {
	children: ReactNode;
	visualProps?: React.ComponentProps<typeof AuthVisual>;
}

export function AuthLayout({ children, visualProps }: AuthLayoutProps) {
	return (
		<div className="min-h-screen flex">
			{/* Left Side - Form Content */}
			<div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white">
				<div className="w-full max-w-md">{children}</div>
			</div>

			{/* Right Side - Visual */}
			<AuthVisual {...visualProps} />
		</div>
	);
}
