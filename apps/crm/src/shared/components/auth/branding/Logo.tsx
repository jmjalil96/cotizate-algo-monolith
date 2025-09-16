interface LogoProps {
	className?: string;
	size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
	sm: "text-2xl",
	md: "text-3xl",
	lg: "text-4xl",
	xl: "text-5xl",
};

export function Logo({ className = "", size = "lg" }: LogoProps) {
	return (
		<h1 className={`font-bold ${sizeClasses[size]} ${className}`}>
			<span style={{ color: "#093FB4" }}>Cotízate</span>
			<span style={{ color: "#ED3500" }}>Algo</span>
		</h1>
	);
}
