interface AuthVisualProps {
	title?: string;
	subtitle?: string;
	description?: string;
	stats?: Array<{
		value: string;
		label: string;
	}>;
}

const defaultStats = [
	{ value: "99.9%", label: "Disponibilidad" },
	{ value: "50K+", label: "Pólizas" },
	{ value: "24/7", label: "Soporte" },
];

export function AuthVisual({
	title = "Administra Seguros",
	subtitle = "Como Nunca",
	description = "Optimiza tus operaciones de seguros con nuestra plataforma integral de gestión.",
	stats = defaultStats,
}: AuthVisualProps) {
	return (
		<div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
			{/* Background Gradient */}
			<div
				className="absolute inset-0"
				style={{
					background: "linear-gradient(135deg, #093FB4 0%, #1155DA 100%)",
				}}
			/>

			{/* Subtle Pattern Overlay */}
			<div className="absolute inset-0 opacity-10">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
						backgroundSize: "60px 60px",
					}}
				/>
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col justify-center px-16 text-white">
				<div className="max-w-lg">
					<h1 className="text-5xl font-bold leading-tight mb-6">
						{title}
						<br />
						<span className="text-blue-200">{subtitle}</span>
					</h1>
					<p className="text-xl text-blue-100 leading-relaxed mb-12">{description}</p>

					{/* Stats */}
					<div className="grid grid-cols-3 gap-8">
						{stats.map((stat) => (
							<div key={`${stat.value}-${stat.label}`} className="text-center">
								<div className="text-3xl font-bold mb-2">{stat.value}</div>
								<div className="text-blue-200 text-sm">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
